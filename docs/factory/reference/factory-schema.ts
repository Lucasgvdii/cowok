/**
 * Schema de `factory.yaml` y `flows/*.yaml` — zod, vive en @factory/contracts.
 * (No compilado en este entorno de scoping: el registry npm está bloqueado. Verificado contra los ejemplos con un script Python equivalente.)
 *
 * Principio: el schema es la frontera. Todo lo que el schema rechaza, el orchestrator nunca lo ve.
 * Las líneas rojas del MVP (apply commit, humanRequiredAbove never, flows sin gates ni budget) se rechazan ACÁ.
 */
import { z } from 'zod';

const PluginIdZ = z.string().regex(/^[a-z][a-z0-9-]*$/);
const LaneZ = z.string().regex(/^[a-z][a-z0-9-]*$/);
const FlowIdZ = z.string().regex(/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*@\d+$/); // eng/codegen@1
const RiskLevelZ = z.enum(['low', 'medium', 'high']);
const SensitivityZ = z.enum(['public', 'internal', 'confidential', 'regulated']);

/** Un plugin bindeado: id + config libre (validada después contra plugin.configSchema). */
const BindingZ = z.object({
  id: PluginIdZ,
  with: z.record(z.string(), z.unknown()).optional(),
});

const GateBindingZ = BindingZ.extend({
  kind: z.enum(['command', 'builtin']).default('builtin'),
  run: z.string().optional(), // solo kind=command
  parser: z.string().optional(), // 'tsc' | 'vitest' | 'eslint' | 'junit' | 'json-findings'
  timeoutMinutes: z.number().int().positive().default(15),
}).refine((g) => g.kind !== 'command' || (g.run && g.parser), { message: 'command gate requires run + parser' });

const RunnerBindingZ = BindingZ.extend({
  lane: LaneZ,
  produces: z.array(z.string()).min(1),
  profiles: z.record(z.string(), z.record(z.string(), z.unknown())).optional(), // 'fast' | 'thorough' → config opaca
});

const MonitorProfileZ = z.object({
  mode: z.enum(['none', 'passive', 'active']),
  windowMinutes: z.number().int().nonnegative(),
  pollMinutes: z.number().int().positive().optional(),
  maxChildren: z.number().int().nonnegative().default(1),
  subscriptions: z.array(z.object({
    source: PluginIdZ,
    metric: z.string(),
    condition: z.object({ op: z.enum(['gt', 'lt', 'eq', 'neq', 'delta_gt']), value: z.union([z.number(), z.string()]), forMinutes: z.number().int().positive().optional() }),
    childFlow: FlowIdZ,
    reason: z.enum(['perf', 'incident', 'adjust']),
  })).default([]),
});

const BudgetZ = z.object({
  maxAttempts: z.number().int().min(1).max(10),
  maxUsd: z.number().positive(),
  maxWallClockMinutes: z.number().int().positive(),
  maxNoProgress: z.number().int().min(1).default(1),
  maxSameRunnerAttempts: z.number().int().min(1).default(2),
  humanTimeoutHours: z.number().positive().default(72),
});

// ─────────────────────────────────────────────────────────────────────────────
// factory.yaml — binding por repo/dominio
// ─────────────────────────────────────────────────────────────────────────────
export const FactoryYamlZ = z.object({
  apiVersion: z.literal('factory/v1'),
  domain: z.string().regex(/^[a-z][a-z0-9-]*$/),
  pack: z.string(), // '@factory/pack-eng@1.x'
  egress: z.object({
    allowExternalLlm: z.boolean().default(false), // conservador: opt-in
    maxSensitivity: SensitivityZ.default('internal'),
  }).default({ allowExternalLlm: false, maxSensitivity: 'internal' }),
  intake: z.array(BindingZ).min(1),
  routers: z.array(BindingZ).min(1),
  lanes: z.array(z.object({ id: LaneZ, concurrency: z.number().int().positive().default(1) })).min(1),
  runners: z.array(RunnerBindingZ).min(1),
  context: z.array(BindingZ).default([]),
  gates: z.array(GateBindingZ).min(1),
  critics: z.array(BindingZ).default([]),
  risk: z.object({
    policies: z.array(BindingZ).min(1),
    human: BindingZ,
    approvers: z.array(z.string()).min(1),
  }),
  apply: z.array(BindingZ.extend({ modes: z.array(z.enum(['draft', 'commit'])).min(1) })).min(1),
  signals: z.array(BindingZ).default([]),
  monitor: z.object({
    profiles: z.record(z.string(), MonitorProfileZ),
    /** matrix[impact][relevance] → profile name */
    matrix: z.record(RiskLevelZ, z.record(RiskLevelZ, z.string())),
  }),
  budgets: z.record(z.string(), BudgetZ), // 'default', 'child', ...
  flows: z.array(z.string()).min(1), // paths relativos a flows/*.yaml
  skills: z.array(z.string()).default([]),
})
  // Líneas rojas MVP (apiVersion v1):
  .refine((f) => f.apply.every((a) => !a.modes.includes('commit')), { message: 'factory/v1: apply.modes may not include "commit"' })
  .refine((f) => f.runners.every((r) => f.lanes.some((l) => l.id === r.lane)), { message: 'runner.lane must be a declared lane' })
  .refine((f) => Object.values(f.monitor.matrix).every((row) => Object.values(row).every((p) => p in f.monitor.profiles)), { message: 'monitor.matrix references unknown profile' });

export type FactoryYaml = z.infer<typeof FactoryYamlZ>;

// ─────────────────────────────────────────────────────────────────────────────
// flows/<name>.yaml — un flow. Solo bindea, no reordena stages.
// ─────────────────────────────────────────────────────────────────────────────
export const FlowYamlZ = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/), // 'codegen'; FlowId completo = `${domain}/${id}@${version}`
  version: z.number().int().positive(),
  description: z.string().optional(),
  artifact: z.string(), // 'patch' | 'journal_draft' | pack-defined
  trigger: z.object({ intake: PluginIdZ, match: z.record(z.string(), z.unknown()).optional() }),
  child: z.boolean().default(false), // true = solo se abre desde watch/retrigger, nunca desde intake
  stages: z.object({
    route: z.object({ router: PluginIdZ, lanes: z.array(LaneZ).min(1), runners: z.array(PluginIdZ).min(1), profiles: z.array(z.string()).optional() }),
    act: z.object({ skills: z.array(z.string()).default([]), context: z.array(z.object({ port: PluginIdZ, kind: z.string(), params: z.record(z.string(), z.unknown()).default({}), maxBytes: z.number().int().positive().default(200_000) })).default([]) }),
    gates: z.array(PluginIdZ).min(1), // ≥1 SIEMPRE
    critics: z.array(PluginIdZ).default([]),
    risk: z.object({ policy: PluginIdZ, humanRequiredAbove: z.enum(['low', 'medium', 'high', 'always']).default('always') }), // 'never' no existe en v1
    apply: z.object({ applier: PluginIdZ, mode: z.enum(['draft', 'commit']).default('draft') }),
    watch: z.union([z.object({ profile: z.string() }), z.object({ mode: z.literal('none') })]).default({ mode: 'none' }),
  }),
  retrigger: z.array(z.object({ on: z.string(), flow: FlowIdZ, reason: z.enum(['perf', 'incident', 'adjust']) })).default([]),
  budget: z.union([z.string(), BudgetZ]), // nombre en factory.budgets o inline
})
  .refine((f) => f.stages.apply.mode === 'draft', { message: 'factory/v1: flow apply.mode must be draft' });

export type FlowYaml = z.infer<typeof FlowYamlZ>;

/**
 * resolveFlow(factory, flow) → FlowSpec (contracts §10):
 *  - verifica que cada PluginId referenciado exista en factory.* y en el PackManifest;
 *  - expande budget por nombre; expande watch.profile a MonitorProfile;
 *  - valida `with:` de cada binding contra plugin.configSchema;
 *  - digest = sha256(JSON canónico del FlowSpec) → se pinnea en el ticket.
 */
