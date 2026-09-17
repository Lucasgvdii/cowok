/**
 * @factory/contracts — borrador v0 (scoping).
 *
 * Regla única: todo lo que cruza el límite control-plane ↔ plugin pasa por estos tipos.
 * Este archivo no importa nada. Los packs importan de acá. El control plane importa de acá.
 * Nadie importa del control plane ni de un pack.
 *
 * Compila standalone: `tsc --noEmit --strict contracts.ts`
 */

// ─────────────────────────────────────────────────────────────────────────────
// 0. Identidad
// ─────────────────────────────────────────────────────────────────────────────

/** 'eng' | 'accounting' | ... Lo define el pack. */
export type Domain = string;
/** `${Domain}/${name}@${version}` — ej. 'eng/codegen@1'. Inmutable una vez publicado. */
export type FlowId = string;
export type TicketId = string; // `${Domain}/${ulid}`
export type ArtifactId = string;
export type PluginId = string; // 'github-issue', 'claude-code', 'typecheck', 'github-pr'
/** Cola lógica. En Temporal se mapea 1:1 a un task queue. */
export type Lane = string;
export type AttemptNo = number;
export type IsoDate = string;

export interface PluginRef {
  id: PluginId;
  version: string;
}

export type Sensitivity = 'public' | 'internal' | 'confidential' | 'regulated';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Decision<T> — el único formato en el que router / critics / risk "opinan"
// ─────────────────────────────────────────────────────────────────────────────

export type DeciderKind = 'rules' | 'llm' | 'jev' | 'human';

export interface EvidenceRef {
  kind: 'artifact' | 'context' | 'gate' | 'finding' | 'signal' | 'external';
  ref: string; // id o uri
  note?: string;
}

/**
 * Jev: Choice → Decision<Enum>, Score → Decision<number>, Noul (abstención) → value: null.
 * Un Decider LLM debe devolver exactamente esto (structured output), nunca prosa.
 */
export interface Decision<T> {
  value: T | null;
  confidence: number; // 0..1. Reglas => 1.
  by: { kind: DeciderKind; ref: PluginRef | string };
  evidence: EvidenceRef[];
  /** Cortas, para auditoría. NUNCA se reenvían al actor como instrucción. */
  reasons?: string[];
  at: IsoDate;
}

/** Abstracción opcional detrás de Router / Critic / RiskPolicy. */
export interface Decider {
  readonly id: PluginId;
  readonly kind: DeciderKind;
  choose<T extends string>(q: { question: string; options: readonly T[]; evidence: EvidenceRef[]; sensitivity: Sensitivity }): Promise<Decision<T>>;
  score(q: { question: string; range: [number, number]; evidence: EvidenceRef[]; sensitivity: Sensitivity }): Promise<Decision<number>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Finding + Proposal — el único canal de feedback hacia el actor
// ─────────────────────────────────────────────────────────────────────────────

export type Severity = 'info' | 'warn' | 'block';

export type Locator =
  | { kind: 'file'; path: string; line?: number; col?: number }
  | { kind: 'row'; rowId: string; field?: string }
  | { kind: 'entry'; entryId: string; lineNo?: number }
  | { kind: 'artifact' };

/**
 * Proposals core. Los packs extienden con `${Domain}/${kind}` y validan con su propio schema.
 * Regla: una proposal es ejecutable o rechazable por el actor sin interpretar prosa.
 */
export type CoreProposal =
  | { kind: 'replace_range'; path: string; from: [line: number, col: number]; to: [line: number, col: number]; with: string }
  | { kind: 'add_test'; path: string; describe: string; assertion: string }
  | { kind: 'revert_path'; path: string }
  | { kind: 'set_field'; rowId: string; field: string; value: string | number | boolean | null }
  | { kind: 'reclassify'; entryId: string; account: string }
  | { kind: 'split_entry'; entryId: string; parts: Array<{ account: string; amount: number }> }
  | { kind: 'drop_entry'; entryId: string }
  | { kind: 'replan'; reason: string }; // no hay fix mecánico: el actor debe re-plantear

export type PackProposal = { kind: `${string}/${string}`; [k: string]: unknown };
export type Proposal = CoreProposal | PackProposal;

export interface Finding {
  id: string;
  /** hash(code + locator normalizado). Base del cap `maxNoProgress`. */
  fingerprint: string;
  /** Estable y namespaced: 'tsc/TS2322', 'eslint/no-unused-vars', 'acct/entry.unbalanced'. */
  code: string;
  severity: Severity;
  source: { stage: 'gate' | 'critic' | 'human' | 'signal'; plugin: PluginId };
  locator: Locator;
  message: string; // 1 línea, para humanos
  proposal?: Proposal;
  confidence?: number;
}

/** Lo que recibe el actor en el intento N+1. Nunca historial de chat. */
export interface FeedbackBundle {
  attempt: AttemptNo;
  blocking: Finding[]; // dedup por fingerprint
  advisory: Finding[]; // warn/info, el actor puede ignorarlos
  humanNotes?: string[]; // solo si HumanDecision.kind === 'reject'
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Artifact — lo único que produce el actor
// ─────────────────────────────────────────────────────────────────────────────

export interface Artifact<K extends string = string, P = unknown> {
  id: ArtifactId;
  ticketId: TicketId;
  attempt: AttemptNo;
  kind: K; // 'patch' | 'journal_draft' | `${Domain}/${string}`
  payload: P;
  digest: string; // sha256(payload canónico)
  producedBy: PluginRef;
  parentArtifactId?: ArtifactId;
  summary: string;
  cost: Cost;
  createdAt: IsoDate;
}

export interface Cost {
  usd: number;
  tokensIn?: number;
  tokensOut?: number;
  wallClockMs: number;
}

// Artifact kinds core (los packs pueden definir otros)
export interface PatchPayload {
  baseSha: string;
  diff: string; // unified diff
  touchedPaths: string[];
  commitMessage: string;
}
export type PatchArtifact = Artifact<'patch', PatchPayload>;

export interface JournalLine {
  account: string;
  debit?: number;
  credit?: number;
  taxCode?: string;
  costCenter?: string;
}
export interface JournalEntry {
  id: string;
  date: IsoDate;
  memo: string;
  sourceRowId: string;
  vendor?: string;
  lines: JournalLine[];
  classification: Decision<string>; // account elegido, con evidencia
}
export interface JournalDraftPayload {
  period: string; // 'YYYY-MM'
  currency: string;
  entries: JournalEntry[];
  sourceRowIds: string[];
  unclassifiedRowIds: string[];
}
export type JournalDraftArtifact = Artifact<'journal_draft', JournalDraftPayload>;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Gate / Risk / Monitor / Apply / Signal / Human
// ─────────────────────────────────────────────────────────────────────────────

export interface GateResult {
  gate: PluginId;
  /** 'error' = el gate no pudo correr. NO es pass. */
  status: 'pass' | 'fail' | 'error';
  findings: Finding[];
  logsRef?: string;
  cost: Cost;
}

export type RiskLevel = 'low' | 'medium' | 'high';
export type Impact = 'low' | 'medium' | 'high';
export type Relevance = 'low' | 'medium' | 'high';

export interface RiskDecision {
  level: Decision<RiskLevel>;
  impact: Decision<Impact>;
  relevance: Decision<Relevance>;
  requiresHuman: boolean; // derivado en el workflow de level vs humanRequiredAbove; nunca lo decide un LLM solo
  monitor: MonitorPolicy; // derivado de monitor.matrix[impact][relevance]
  at: IsoDate;
}

export interface SignalSubscription {
  source: PluginId; // 'datadog', 'synthetic', 'erp-reconciliation'
  metric: string; // 'http.p95_ms', 'ci.main.status', 'reconciliation.delta'
  condition: { op: 'gt' | 'lt' | 'eq' | 'neq' | 'delta_gt'; value: number | string; forMinutes?: number };
  childFlow: FlowId; // qué flow hijo abrir
  reason: ChildReason;
}

export interface MonitorPolicy {
  mode: 'none' | 'passive' | 'active';
  windowMinutes: number;
  subscriptions: SignalSubscription[];
  /** Cuántos hijos puede abrir un ticket en su ventana. Cap contra tormentas. */
  maxChildren: number;
}

export type ChildReason = 'perf' | 'incident' | 'adjust';

export interface Signal {
  id: string;
  source: PluginId;
  ticketId: TicketId;
  metric: string;
  value: number | string;
  matched: SignalSubscription;
  observedAt: IsoDate;
  evidence: EvidenceRef[];
}

export type ApplyMode = 'draft' | 'commit';

export interface ApplyRef {
  applier: PluginId;
  mode: ApplyMode;
  externalRef: string; // 'acme/sandbox#87', 'journal:2026-08:draft:01J...'
  url?: string;
  rollbackRef?: string;
  appliedAt: IsoDate;
}

export type HumanDecision =
  | { kind: 'approve'; by: string; note?: string; at: IsoDate }
  | { kind: 'reject'; by: string; findings: Finding[]; note?: string; at: IsoDate }
  | { kind: 'edit'; by: string; artifactId: ArtifactId; at: IsoDate } // reservado, no MVP
  | { kind: 'defer'; by: string; untilIso: IsoDate; at: IsoDate };

// ─────────────────────────────────────────────────────────────────────────────
// 5. Budget / Spend
// ─────────────────────────────────────────────────────────────────────────────

export interface Budget {
  maxAttempts: number;
  maxUsd: number;
  maxWallClockMinutes: number;
  /** intentos consecutivos con el mismo set de fingerprints bloqueantes. Default 1. */
  maxNoProgress: number;
  /** intentos consecutivos con el mismo runner antes de forzar re-route con exclude. */
  maxSameRunnerAttempts: number;
  humanTimeoutHours: number;
}

export interface Spend {
  usd: number;
  attempts: AttemptNo;
  wallClockMs: number;
  noProgressStreak: number;
  sameRunnerStreak: number;
  lastBlockingFingerprints: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Ticket — proyección. La verdad es el event log.
// ─────────────────────────────────────────────────────────────────────────────

export type TicketState =
  | 'received'
  | 'routed'
  | 'acting'
  | 'gating'
  | 'reviewing'
  | 'assessing'
  | 'awaiting_human'
  | 'applying'
  | 'applied'
  | 'watching'
  | 'closed'
  | 'escalated'
  | 'failed'
  | 'cancelled';

export interface OutcomeSpec {
  goal: string;
  acceptance: string[];
  constraints?: string[];
}

export interface RouteChoice {
  flowId: FlowId;
  lane: Lane;
  runner: PluginId;
  /** Hint opaco para el runner (ej. modelo). Solo valores declarados en factory.yaml. */
  runnerProfile?: string;
}

export interface Ticket {
  id: TicketId;
  domain: Domain;
  state: TicketState;
  outcome: OutcomeSpec;
  intake: { adapter: PluginId; externalRef: string; receivedAt: IsoDate; requestedFlow?: FlowId };
  parent?: { ticketId: TicketId; reason: ChildReason; signalId: string };
  flowId?: FlowId;
  flowDigest?: string; // FlowSpec resuelto, pinned en 'routed'
  route?: Decision<RouteChoice>;
  budget: Budget;
  spend: Spend;
  attempt: AttemptNo;
  currentArtifactId?: ArtifactId;
  lastRisk?: RiskDecision;
  applyRef?: ApplyRef;
  childTicketIds: TicketId[];
  version: number;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/** Transiciones legales. El workflow las valida; cualquier otra es bug. */
export const TICKET_TRANSITIONS: Readonly<Record<TicketState, readonly TicketState[]>> = {
  received: ['routed', 'cancelled', 'failed'],
  routed: ['acting', 'cancelled', 'failed'],
  acting: ['gating', 'escalated', 'failed', 'cancelled'],
  gating: ['reviewing', 'acting', 'escalated', 'failed'],
  reviewing: ['assessing', 'acting', 'escalated', 'failed'],
  assessing: ['awaiting_human', 'applying', 'escalated', 'failed'],
  awaiting_human: ['applying', 'acting', 'closed', 'escalated', 'cancelled'],
  applying: ['applied', 'failed'],
  applied: ['watching', 'closed'],
  watching: ['closed', 'escalated'],
  closed: [],
  escalated: ['acting', 'closed', 'cancelled'], // solo por HumanDecision
  failed: ['acting', 'closed'], // solo por HumanDecision
  cancelled: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Eventos — append-only. El ticket es una proyección de esto.
// ─────────────────────────────────────────────────────────────────────────────

export type TicketEvent =
  | { type: 'ticket.received'; ticket: Ticket }
  | { type: 'ticket.transitioned'; from: TicketState; to: TicketState; reason: string }
  | { type: 'route.decided'; decision: Decision<RouteChoice>; excluded: PluginId[] }
  | { type: 'artifact.produced'; artifact: Artifact }
  | { type: 'runner.failed'; runner: PluginId; error: string; retryable: boolean }
  | { type: 'gate.completed'; result: GateResult }
  | { type: 'critic.completed'; critic: PluginId; findings: Finding[]; cost: Cost }
  | { type: 'feedback.sent'; bundle: FeedbackBundle }
  | { type: 'risk.assessed'; decision: RiskDecision }
  | { type: 'human.requested'; to: string[]; artifactId: ArtifactId }
  | { type: 'human.decided'; decision: HumanDecision }
  | { type: 'apply.completed'; ref: ApplyRef }
  | { type: 'monitor.started'; policy: MonitorPolicy }
  | { type: 'signal.received'; signal: Signal }
  | { type: 'child.spawned'; childTicketId: TicketId; reason: ChildReason }
  | { type: 'budget.exceeded'; cap: keyof Budget; spend: Spend }
  | { type: 'ticket.escalated'; reason: string; to: string[] };

export interface EventEnvelope {
  seq: number;
  ticketId: TicketId;
  at: IsoDate;
  actor: 'workflow' | PluginId | `human:${string}`;
  event: TicketEvent;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Contexto compartido por todos los puertos
// ─────────────────────────────────────────────────────────────────────────────

export interface PortContext {
  ticket: Readonly<Ticket>;
  attempt: AttemptNo;
  flow: Readonly<FlowSpec>;
  /** Config del plugin tal como está en factory.yaml (`with:`). Ya validada por el schema del plugin. */
  config: Record<string, unknown>;
  /** Solo Applier y SignalSource reciben secrets. Runner recibe {} siempre. */
  secrets: Readonly<Record<string, string>>;
  workdir?: string;
  log: (level: 'debug' | 'info' | 'warn' | 'error', msg: string, data?: Record<string, unknown>) => void;
  /** Heartbeat para actividades largas (runner). No-op fuera de Temporal. */
  heartbeat: (progress?: string) => void;
  now: () => IsoDate;
}

export interface ContextItem {
  id: string;
  kind: string; // 'file', 'doc', 'log', 'record', 'metric'
  uri: string;
  content?: string;
  sensitivity: Sensitivity;
  bytes: number;
}
export interface ContextBundle {
  items: ContextItem[];
  truncated: boolean;
  /** max(sensitivity) — el workflow lo usa para decidir si un Decider externo está permitido. */
  sensitivity: Sensitivity;
}
export interface ContextQuery {
  kind: string; // 'repo', 'docs', 'ci-logs', 'coa', 'vendor-master', 'prior-classifications'
  params: Record<string, unknown>;
  maxBytes: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Puertos (uno por caja del diagrama)
// ─────────────────────────────────────────────────────────────────────────────

export interface Plugin {
  readonly id: PluginId;
  readonly version: string;
  /** Schema (JSON Schema) del bloque `with:` en factory.yaml. Se valida al resolver. */
  readonly configSchema?: unknown;
}

/** intake — push: el adapter parsea un evento externo y devuelve la semilla del ticket. */
export interface IntakeAdapter extends Plugin {
  readonly source: string; // 'github', 'csv', 'slack', 'cli'
  parse(raw: unknown, ctx: Pick<PortContext, 'config' | 'log' | 'now'>): Promise<TicketSeed | { ignore: true; reason: string }>;
}
export interface TicketSeed {
  domain: Domain;
  externalRef: string; // clave de idempotencia
  outcome: OutcomeSpec;
  requestedFlow?: FlowId;
  sensitivity: Sensitivity;
  raw?: unknown;
}

/** route — elige entre lo declarado. Nunca inventa runners ni flows. */
export interface Router extends Plugin {
  route(input: { ticket: Ticket; allowed: { flows: FlowId[]; lanes: Lane[]; runners: PluginId[] }; exclude: PluginId[] }, ctx: PortContext): Promise<Decision<RouteChoice>>;
}

/** act — el actor. Sin credenciales de escritura. Produce un Artifact o falla tipado. */
export interface Runner extends Plugin {
  readonly produces: string[]; // artifact kinds
  run(input: RunnerInput, ctx: PortContext): Promise<RunnerOutput>;
}
export interface RunnerInput {
  outcome: OutcomeSpec;
  artifactKind: string;
  context: ContextBundle;
  feedback?: FeedbackBundle;
  previousArtifact?: Artifact;
  skills: string[]; // paths a skills versionadas en el repo (skills/*.md)
  profile?: string;
  budget: { maxUsd: number; maxWallClockMinutes: number };
}
export type RunnerOutput =
  | { ok: true; artifact: Artifact }
  | { ok: false; kind: 'infra' | 'timeout' | 'budget' | 'refused' | 'invalid_artifact'; error: string; cost: Cost };

/** context — read-only. */
export interface ContextPort extends Plugin {
  fetch(query: ContextQuery, ctx: PortContext): Promise<ContextBundle>;
}

/** gates — código/reglas. Sin LLM. */
export interface Gate extends Plugin {
  check(artifact: Artifact, ctx: PortContext): Promise<GateResult>;
}

/** critics — especialistas. Puede haber LLM/Jev detrás. Solo emiten findings. */
export interface Critic extends Plugin {
  readonly specialty: string; // 'security', 'scope', 'policy', 'data', 'infra'
  review(input: { artifact: Artifact; gates: GateResult[]; context: ContextBundle }, ctx: PortContext): Promise<Finding[]>;
}

/** risk — impacto × relevancia + nivel. En MVP: reglas. */
export interface RiskPolicy extends Plugin {
  assess(input: { artifact: Artifact; gates: GateResult[]; findings: Finding[]; context: ContextBundle }, ctx: PortContext): Promise<{ level: Decision<RiskLevel>; impact: Decision<Impact>; relevance: Decision<Relevance> }>;
}

/** apply — el único con credenciales. Idempotente por (ticketId, artifact.digest). */
export interface Applier extends Plugin {
  readonly modes: readonly ApplyMode[];
  apply(artifact: Artifact, mode: ApplyMode, ctx: PortContext): Promise<ApplyRef>;
  /** Para idempotencia: ¿ya existe un apply para este artifact? */
  find(artifact: Artifact, ctx: PortContext): Promise<ApplyRef | null>;
}

/** watch — fuente de señales. subscribe es idempotente por (ticketId, subscription). */
export interface SignalSource extends Plugin {
  subscribe(policy: MonitorPolicy, ctx: PortContext): Promise<{ handle: string }>;
  /** Pull para fuentes sin webhook. El workflow lo llama cada `pollMinutes`. */
  poll?(handle: string, ctx: PortContext): Promise<Signal[]>;
  unsubscribe(handle: string, ctx: PortContext): Promise<void>;
}

/** human — pide una decisión. La respuesta llega como Temporal signal, no como return. */
export interface HumanGate extends Plugin {
  request(input: { artifact: Artifact; risk: RiskDecision; findings: Finding[]; approvers: string[] }, ctx: PortContext): Promise<{ requestRef: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Pack + FlowSpec — lo que el resolver produce a partir de factory.yaml
// ─────────────────────────────────────────────────────────────────────────────

export interface PackManifest {
  domain: Domain;
  version: string;
  artifactKinds: Record<string, { schema: unknown }>; // JSON Schema del payload
  proposalKinds: Record<string, { schema: unknown }>;
  plugins: {
    intake: IntakeAdapter[];
    routers: Router[];
    runners: Runner[];
    context: ContextPort[];
    gates: Gate[];
    critics: Critic[];
    risk: RiskPolicy[];
    appliers: Applier[];
    signals: SignalSource[];
    human: HumanGate[];
  };
}

export interface StageBinding<C = Record<string, unknown>> {
  plugin: PluginId;
  with?: C;
}

/** FlowSpec resuelto = factory.yaml ⊕ flows/<name>.yaml. Se pinnea por digest en el ticket. */
export interface FlowSpec {
  id: FlowId;
  domain: Domain;
  digest: string;
  artifactKind: string;
  trigger: { intake: PluginId; match?: Record<string, unknown> };
  stages: {
    route: { router: PluginId; lanes: Lane[]; runners: PluginId[]; profiles?: string[] };
    act: { skills: string[]; context: Array<ContextQuery & { port: PluginId }> };
    gates: StageBinding[]; // ≥ 1, obligatorio
    critics: StageBinding[]; // puede ser []
    risk: { policy: PluginId; humanRequiredAbove: RiskLevel | 'always'; approvers: string[]; human: PluginId };
    apply: { applier: PluginId; mode: ApplyMode };
    watch: { profile: string } | { mode: 'none' };
  };
  retrigger: Array<{ on: string; flow: FlowId; reason: ChildReason }>;
  budget: Budget;
  egress: { allowExternalLlm: boolean; maxSensitivity: Sensitivity };
}
