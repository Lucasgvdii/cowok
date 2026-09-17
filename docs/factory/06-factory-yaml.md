# 6. `factory.yaml` — schema y ejemplos

Schema completo (zod): [reference/factory-schema.ts](reference/factory-schema.ts).
Ejemplos completos: [reference/examples/eng/](reference/examples/eng/) y [reference/examples/accounting/](reference/examples/accounting/).

## 6.1 Dos archivos, dos responsabilidades

| Archivo | Responde | Cambia cuando |
|---------|----------|---------------|
| `factory.yaml` (1 por repo/dominio) | **qué plugins existen y cómo se configuran** en este repo: intake, lanes, runners, gates (con comandos), critics, risk, appliers, signals, perfiles de monitor, budgets nombrados, egress | se agrega un plugin, cambia un comando de CI, cambia un aprobador |
| `flows/<name>.yaml` (N por repo) | **qué plugins usa cada flow y con qué umbrales**: trigger, artifact, binding por stage, retrigger, budget | cambia el proceso (ej. agregar un critic al flow de codegen) |

Un pack (`@factory/pack-eng`) provee las implementaciones. `factory.yaml` las instancia. `flows/*.yaml` las compone. Ninguno de los tres toca el control plane.

## 6.2 Esqueleto mínimo para engancharse

```yaml
# factory.yaml — lo mínimo que acepta el schema
apiVersion: factory/v1
domain: <domain>
pack: "@factory/pack-<domain>@1"
intake:   [{ id: <intake-plugin> }]
routers:  [{ id: rules }]
lanes:    [{ id: <domain>-default }]
runners:  [{ id: noop, lane: <domain>-default, produces: [<artifact-kind>] }]
gates:    [{ id: <at-least-one-gate> }]
risk:
  policies: [{ id: rules }]
  human: { id: cli }
  approvers: ["<someone>"]
apply:    [{ id: <applier>, modes: [draft] }]
monitor:
  profiles: { none: { mode: none, windowMinutes: 0 } }
  matrix:
    low:    { low: none, medium: none, high: none }
    medium: { low: none, medium: none, high: none }
    high:   { low: none, medium: none, high: none }
budgets:
  default: { maxAttempts: 3, maxUsd: 5, maxWallClockMinutes: 60 }
flows: [flows/main.yaml]
```

```yaml
# flows/main.yaml
id: main
version: 1
artifact: <artifact-kind>
trigger: { intake: <intake-plugin> }
stages:
  route:  { router: rules, lanes: [<domain>-default], runners: [noop] }
  act:    {}
  gates:  [<at-least-one-gate>]
  risk:   { policy: rules }          # humanRequiredAbove: always por default
  apply:  { applier: <applier> }     # mode: draft por default
budget: default
```

Con esto un dominio nuevo corre el grafo entero con `noop`. El siguiente paso es reemplazar `noop` por un runner real y agregar gates.

## 6.3 Lo que el schema rechaza (líneas rojas en código)

| Regla | Dónde |
|-------|-------|
| `apply.modes` con `commit` | `FactoryYamlZ.refine` |
| `flow.stages.apply.mode: commit` | `FlowYamlZ.refine` |
| `humanRequiredAbove: never` | no existe en el enum |
| flow sin `gates` | `gates: min(1)` |
| flow sin `budget` | campo requerido |
| runner en lane no declarada | `refine` |
| `monitor.matrix` que referencia perfil inexistente | `refine` |
| `egress.allowExternalLlm` sin declarar | default `false` |

Subir a `factory/v2` (post-MVP) es lo que habilita `commit` y `humanRequiredAbove: low` con auto-apply. Es un cambio de schema, visible en el diff del repo, no un flag de runtime.

## 6.4 Ejemplo `eng` (resumen; completo en `reference/examples/eng/`)

- 2 lanes (`eng-default`, `eng-heavy`), 2 runners (`claude-code` con perfiles `fast`/`thorough`, `noop`).
- 3 gates `command` con parsers `tsc`, `vitest`, `eslint`.
- Critics `scope` (rules) y `security` (llm-structured, solo `warn`).
- `egress.allowExternalLlm: true`, `maxSensitivity: internal` (código interno puede ir a un LLM externo; pregunta Q4 si no).
- Matriz de monitor: `high×high → post-merge-active`, resto `post-merge-passive` o `none`.
- Flows: `codegen@1` (trigger `github-issue` label `factory`), `incident@1` (child), `perf@1` (child, ejemplo).

## 6.5 Ejemplo `accounting` (resumen; completo en `reference/examples/accounting/`)

- 2 lanes (`acct-default`, `acct-batch`), 2 runners (`llm-classifier`, `rules-classifier`) + `noop`. El router elige `rules-classifier` si `egress.allowExternalLlm=false`.
- 6 gates builtin: `schema`, `balance`, `coa`, `period`, `vat`, `duplicate`.
- Critic `policy`.
- `egress.allowExternalLlm: false` por defecto → hasta que Finance responda Q4, el runner es `rules-classifier`.
- Matriz: `high×* → post-draft-active` (poll diario 7 días, reconciliation), `low×low → none`.
- Flows: `expense-classify@1` (trigger `csv`), `expense-adjust@1` (child).

## 6.6 Dónde vive el `factory.yaml` de accounting

No hay "repo de código" natural. Propuesta: un repo `finance-factory/` que contiene `factory.yaml`, `flows/`, `skills/`, `data/coa.csv`, `data/vendors.csv`, `policies/expense-policy.yaml`. Es versionado, revisable por PR, y le da a Finance el mismo modelo mental que a Eng: el proceso está en git.
