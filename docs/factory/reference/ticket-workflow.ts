/**
 * ticketWorkflow — pseudo-implementación del ÚNICO workflow Temporal (scoping, no compila contra @temporalio).
 *
 * Reglas del archivo:
 *  - Solo importa @factory/contracts y los stubs de activities. Nunca un pack.
 *  - Toda decisión de negocio (budgets, requiresHuman, transición) está acá, visible.
 *  - Toda I/O está en activities (idempotentes por key).
 */
import type {
  Artifact, Budget, ChildReason, Decision, FeedbackBundle, Finding, FlowSpec, GateResult, HumanDecision,
  MonitorPolicy, PluginId, RiskDecision, RouteChoice, Signal, Spend, Ticket, TicketState,
} from './contracts';
import { TICKET_TRANSITIONS } from './contracts';

// ── Temporal API (stubs para que el archivo sea legible sin la lib) ─────────
declare function proxyActivities<T>(opts: { taskQueue?: string; startToCloseTimeout: string; heartbeatTimeout?: string; retry?: { maximumAttempts: number; nonRetryableErrorTypes?: string[] } }): T;
declare function defineSignal<Args extends unknown[]>(name: string): { name: string; __args?: Args };
declare function setHandler<Args extends unknown[]>(sig: { name: string; __args?: Args }, fn: (...a: Args) => void): void;
declare function condition(fn: () => boolean, timeout?: string): Promise<boolean>;
declare function startChild(wf: unknown, opts: { workflowId: string; args: unknown[]; parentClosePolicy: 'ABANDON' }): Promise<{ workflowId: string }>;
declare function sleep(ms: string): Promise<void>;
declare function workflowInfo(): { workflowId: string };

// ── Activities (firmas; la implementación resuelve PluginId en el PluginRegistry) ───
interface ControlActivities {
  resolveFlow(i: { domain: string; flowId?: string; requestedFlow?: string; factoryRef: string }): Promise<FlowSpec>;
  loadTicket(ticketId: string): Promise<Ticket>;
  transition(i: { ticketId: string; to: TicketState; reason: string; patch?: Partial<Ticket> }): Promise<Ticket>;
  route(i: { ticketId: string; flow: FlowSpec; exclude: PluginId[] }): Promise<Decision<RouteChoice>>;
  assessRisk(i: { ticketId: string; flow: FlowSpec; artifact: Artifact; gates: GateResult[]; findings: Finding[] }): Promise<RiskDecision>;
  recordBudgetExceeded(i: { ticketId: string; cap: keyof Budget; spend: Spend }): Promise<void>;
  escalate(i: { ticketId: string; reason: string }): Promise<void>;
}
interface LaneActivities {
  runRunner(i: { ticketId: string; attempt: number; runner: PluginId; profile?: string; flow: FlowSpec; feedback?: FeedbackBundle; previousArtifactId?: string }): Promise<
    { ok: true; artifact: Artifact } | { ok: false; kind: string; error: string }
  >;
}
interface IoActivities {
  runGate(i: { ticketId: string; attempt: number; gate: PluginId; artifactId: string; flow: FlowSpec }): Promise<GateResult>;
  runCritic(i: { ticketId: string; attempt: number; critic: PluginId; artifactId: string; gates: GateResult[]; flow: FlowSpec }): Promise<Finding[]>;
  requestHuman(i: { ticketId: string; artifactId: string; risk: RiskDecision; findings: Finding[]; flow: FlowSpec }): Promise<{ requestRef: string }>;
  apply(i: { ticketId: string; artifactId: string; flow: FlowSpec }): Promise<{ externalRef: string }>;
  subscribeSignals(i: { ticketId: string; policy: MonitorPolicy; flow: FlowSpec }): Promise<{ handles: string[] }>;
  pollSignals(i: { ticketId: string; handles: string[]; flow: FlowSpec }): Promise<Signal[]>;
  unsubscribeSignals(i: { ticketId: string; handles: string[]; flow: FlowSpec }): Promise<void>;
}

const control = proxyActivities<ControlActivities>({ taskQueue: 'factory-control', startToCloseTimeout: '1m', retry: { maximumAttempts: 3 } });
const ioFor = (domain: string) => proxyActivities<IoActivities>({ taskQueue: `factory-io:${domain}`, startToCloseTimeout: '30m', retry: { maximumAttempts: 2 } });
const laneFor = (lane: string) =>
  proxyActivities<LaneActivities>({ taskQueue: `lane:${lane}`, startToCloseTimeout: '90m', heartbeatTimeout: '2m', retry: { maximumAttempts: 2, nonRetryableErrorTypes: ['RunnerRefused', 'InvalidArtifact', 'RunnerBudget'] } });

export const humanDecisionSignal = defineSignal<[HumanDecision]>('humanDecision');
export const externalSignal = defineSignal<[Signal]>('signal'); // para SignalSources push (webhook)
export const cancelSignal = defineSignal<[{ by: string; reason: string }]>('cancel');

export async function ticketWorkflow(input: { ticketId: string; factoryRef: string }): Promise<void> {
  let ticket = await control.loadTicket(input.ticketId);
  const io = ioFor(ticket.domain);

  // Estado mutado por signal handlers (objeto, no `let`, para que TS no lo narrowee a `never`).
  const inbox: { human?: HumanDecision; cancelled?: { by: string; reason: string }; pushed: Signal[] } = { pushed: [] };
  setHandler(humanDecisionSignal, (d) => { inbox.human = d; });
  setHandler(externalSignal, (s) => { inbox.pushed.push(s); });
  setHandler(cancelSignal, (c) => { inbox.cancelled = c; });
  // Leer via función: TS no invalida el narrowing de `inbox.cancelled` por asignaciones en closures.
  const cancelled = () => inbox.cancelled;

  const go = async (to: TicketState, reason: string, patch?: Partial<Ticket>) => {
    if (!TICKET_TRANSITIONS[ticket.state].includes(to)) throw new Error(`illegal transition ${ticket.state} → ${to}`);
    ticket = await control.transition({ ticketId: ticket.id, to, reason, patch });
  };

  // ── route ────────────────────────────────────────────────────────────────
  const flow = await control.resolveFlow({ domain: ticket.domain, flowId: ticket.flowId, requestedFlow: ticket.intake.requestedFlow, factoryRef: input.factoryRef });
  let exclude: PluginId[] = [];
  let route = await control.route({ ticketId: ticket.id, flow, exclude });
  if (route.value === null) return escalate('router abstained');
  await go('routed', 'route decided', { flowId: flow.id, flowDigest: flow.digest, route, budget: flow.budget });

  // ── act → gates → critics → risk → human loop ────────────────────────────
  let feedback: FeedbackBundle | undefined;
  let artifact: Artifact | undefined;
  let gates: GateResult[] = [];
  let findings: Finding[] = [];
  let risk: RiskDecision | undefined;

  for (;;) {
    { const c = cancelled(); if (c) return go('cancelled', c.reason); }
    const cap = exceededCap(ticket.spend, flow.budget);
    if (cap) { await control.recordBudgetExceeded({ ticketId: ticket.id, cap, spend: ticket.spend }); return escalate(`budget ${cap}`); }

    if (ticket.spend.sameRunnerStreak >= flow.budget.maxSameRunnerAttempts) {
      exclude = [...exclude, route.value!.runner];
      route = await control.route({ ticketId: ticket.id, flow, exclude });
      if (route.value === null) return escalate('no alternative runner');
      ticket = await control.transition({ ticketId: ticket.id, to: ticket.state, reason: 're-route', patch: { route } });
    }

    // act
    await go('acting', `attempt ${ticket.attempt + 1}`);
    const lane = laneFor(route.value!.lane);
    const out = await lane.runRunner({ ticketId: ticket.id, attempt: ticket.attempt, runner: route.value!.runner, profile: route.value!.runnerProfile, flow, feedback, previousArtifactId: artifact?.id });
    if (!out.ok) {
      if (out.kind === 'refused' || out.kind === 'invalid_artifact') { feedback = replanFeedback(ticket.attempt, out.error); continue; }
      return fail(`runner ${out.kind}: ${out.error}`);
    }
    artifact = out.artifact;

    // gates (paralelo, todos, deterministas)
    await go('gating', 'artifact produced', { currentArtifactId: artifact.id });
    gates = await Promise.all(flow.stages.gates.map((g) => io.runGate({ ticketId: ticket.id, attempt: ticket.attempt, gate: g.plugin, artifactId: artifact!.id, flow })));
    const gateFindings = gates.flatMap((g) => (g.status === 'error' ? [errorFinding(g)] : g.findings));
    if (gateFindings.some((f) => f.severity === 'block')) { feedback = bundle(ticket.attempt, gateFindings); continue; }

    // critics (paralelo; egress ya validado en la activity contra flow.egress)
    await go('reviewing', 'gates passed');
    const criticFindings = (await Promise.all(flow.stages.critics.map((c) => io.runCritic({ ticketId: ticket.id, attempt: ticket.attempt, critic: c.plugin, artifactId: artifact!.id, gates, flow })))).flat();
    findings = [...gateFindings, ...criticFindings];
    if (criticFindings.some((f) => f.severity === 'block')) { feedback = bundle(ticket.attempt, findings); continue; }

    // risk (level/impact/relevance del plugin; requiresHuman y monitor los deriva la activity por reglas del flow)
    await go('assessing', 'critics passed');
    risk = await control.assessRisk({ ticketId: ticket.id, flow, artifact, gates, findings });
    ticket = await control.transition({ ticketId: ticket.id, to: ticket.state, reason: 'risk assessed', patch: { lastRisk: risk } });

    if (!risk.requiresHuman) break;

    // human
    await go('awaiting_human', `risk ${risk.level.value}`);
    inbox.human = undefined;
    await io.requestHuman({ ticketId: ticket.id, artifactId: artifact.id, risk, findings, flow });
    const answered = await condition(() => inbox.human !== undefined || inbox.cancelled !== undefined, `${flow.budget.humanTimeoutHours}h`);
    { const c = cancelled(); if (c) return go('cancelled', c.reason); }
    if (!answered) return escalate('human timeout');
    const d = inbox.human!;
    if (d.kind === 'approve') break;
    if (d.kind === 'reject') { feedback = bundle(ticket.attempt, [...findings, ...d.findings], d.note ? [d.note] : []); continue; }
    if (d.kind === 'defer') { /* simplificado: se re-espera */ continue; }
    return escalate(`unsupported human decision ${d.kind}`);
  }

  // ── apply (siempre draft en MVP; el applier valida mode contra flow) ──────
  await go('applying', 'approved');
  const applied = await io.apply({ ticketId: ticket.id, artifactId: artifact!.id, flow });
  await go('applied', applied.externalRef);

  // ── watch → retrigger ────────────────────────────────────────────────────
  const policy = risk!.monitor;
  if (policy.mode === 'none') return go('closed', 'no monitoring');
  await go('watching', `monitor ${policy.mode} ${policy.windowMinutes}m`);
  const { handles } = await io.subscribeSignals({ ticketId: ticket.id, policy, flow });
  const deadline = Date.now() + policy.windowMinutes * 60_000; // en Temporal real: workflow time, no Date.now()
  const seen = new Set<string>();
  while (Date.now() < deadline) {
    const batch = [...inbox.pushed.splice(0), ...(policy.mode === 'active' ? await io.pollSignals({ ticketId: ticket.id, handles, flow }) : [])];
    for (const s of batch) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      if (ticket.childTicketIds.length >= policy.maxChildren) { await io.unsubscribeSignals({ ticketId: ticket.id, handles, flow }); return escalate('maxChildren reached'); }
      const child = await startChild(ticketWorkflow, {
        workflowId: `ticket:${ticket.domain}:${ticket.id}:${s.id}`,
        args: [{ ticketId: await spawnChildTicket(ticket, s, s.matched.childFlow, s.matched.reason), factoryRef: input.factoryRef }],
        parentClosePolicy: 'ABANDON',
      });
      ticket = await control.transition({ ticketId: ticket.id, to: ticket.state, reason: `child ${child.workflowId}`, patch: { childTicketIds: [...ticket.childTicketIds, child.workflowId] } });
    }
    await sleep('5m');
  }
  await io.unsubscribeSignals({ ticketId: ticket.id, handles, flow });
  return go('closed', 'monitor window elapsed');

  // ── helpers ──────────────────────────────────────────────────────────────
  async function escalate(reason: string) { await control.escalate({ ticketId: ticket.id, reason }); await go('escalated', reason); }
  async function fail(reason: string) { await go('failed', reason); }
}

// Se implementa como activity en la versión real (crea el Ticket hijo con parent y devuelve su id).
declare function spawnChildTicket(parent: Ticket, signal: Signal, flowId: string, reason: ChildReason): Promise<string>;

function exceededCap(s: Spend, b: Budget): keyof Budget | null {
  if (s.attempts >= b.maxAttempts) return 'maxAttempts';
  if (s.usd >= b.maxUsd) return 'maxUsd';
  if (s.wallClockMs >= b.maxWallClockMinutes * 60_000) return 'maxWallClockMinutes';
  if (s.noProgressStreak >= b.maxNoProgress) return 'maxNoProgress';
  return null;
}

function bundle(attempt: number, all: Finding[], humanNotes: string[] = []): FeedbackBundle {
  const byFp = new Map<string, Finding>();
  for (const f of all) if (!byFp.has(f.fingerprint)) byFp.set(f.fingerprint, f);
  const uniq = [...byFp.values()];
  return { attempt: attempt + 1, blocking: uniq.filter((f) => f.severity === 'block'), advisory: uniq.filter((f) => f.severity !== 'block'), humanNotes };
}

function replanFeedback(attempt: number, error: string): FeedbackBundle {
  const f: Finding = { id: `runner-${attempt}`, fingerprint: `runner/refused`, code: 'runner/refused', severity: 'block', source: { stage: 'gate', plugin: 'runner' }, locator: { kind: 'artifact' }, message: error, proposal: { kind: 'replan', reason: error } };
  return { attempt: attempt + 1, blocking: [f], advisory: [] };
}

function errorFinding(g: GateResult): Finding {
  return { id: `gate-error-${g.gate}`, fingerprint: `gate/${g.gate}/error`, code: `gate/${g.gate}/error`, severity: 'block', source: { stage: 'gate', plugin: g.gate }, locator: { kind: 'artifact' }, message: `gate ${g.gate} could not run`, proposal: { kind: 'replan', reason: 'gate infrastructure error' } };
}
