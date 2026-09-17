# 2. MVP slice — el corte más chico que demuestra "mismo control plane, distinto pack"

## 2.1 El claim a demostrar

> Un issue de GitHub recorre el loop `eng` y un CSV de gastos recorre el loop `accounting`
> **sobre el mismo binario del control plane**, con `git diff --stat packages/control-plane` = 0
> entre "eng funciona" y "accounting funciona".

Eso se demuestra con **una** demo de 15 minutos:

```
$ factory submit --domain eng --intake github-issue --ref acme/sandbox#42
ticket eng/01J...  received → routed(codegen@1, claude-code, lane eng-default)
                   → acting(attempt 1) → gating: typecheck FAIL (2 findings) → acting(attempt 2)
                   → gating PASS → reviewing: scope OK, security 1 warn → assessing: medium, human required
                   → awaiting_human
$ factory approve eng/01J... --by lucas
                   → applying → applied(draft PR #87) → watching(passive, 60m) → closed

$ factory submit --domain accounting --intake csv --ref ./expenses-2026-08.csv
ticket acct/01J... received → routed(expense-classify@1, llm-classifier, lane acct-default)
                   → acting → gating: balance OK, coa OK, vat FAIL (1 block) → acting(attempt 2)
                   → gating PASS → reviewing: policy 2 warn → assessing: high (new vendor) → awaiting_human
$ factory approve acct/01J... --by finance
                   → applying → applied(draft journal-2026-08-draft.json) → watching(active, reconciliation)
$ factory signal emit --ticket acct/01J... --metric reconciliation.delta --value 120.5
                   → child ticket acct/01K... (adjust@1, parent=acct/01J..., reason=adjust) → received ...
```

## 2.2 In scope MVP

| Área | Qué entra | Qué lo demuestra |
|------|-----------|------------------|
| **Contratos** | `@factory/contracts`: tipos de [03](03-domain-model.md) + puertos de [04](04-ports-and-packs.md) + zod schemas de `factory.yaml`/`flows/*.yaml` | Ambos packs compilan contra el mismo paquete |
| **Orchestrator** | Temporal (dev server local + 1 worker de control + 1 worker por lane). Un solo `ticketWorkflow`. Ticket projection en Postgres | Ticket sobrevive restart del worker |
| **`factory.yaml`** | Resolver: `factory.yaml` + `flows/*.yaml` → `FlowSpec` con `digest` pinned al ticket | Cambiar el yaml no altera tickets en vuelo |
| **Runners** | 1 real: `claude-code` (headless en contenedor, sin creds de escritura) para eng; `llm-classifier` (structured output) para accounting. 1 `noop` que devuelve un artifact fixture | Con `noop` el grafo entero corre en < 10 s (test de integración) |
| **Gates command** | `kind: command` con parsers `tsc`, `vitest`, `eslint` (eng) y gates builtin del pack accounting (`schema`, `balance`, `coa`, `period`, `vat`, `duplicate`) | Un gate rojo produce `Finding` con `Proposal` tipada |
| **Loop findings → actor** | `FeedbackBundle` = findings bloqueantes deduplicados por `fingerprint` + proposals. Caps: `maxAttempts=3`, `maxNoProgress=1`, `maxUsd`, `maxSameRunnerAttempts=2` | Ticket con gate que nunca pasa termina en `escalated`, no en attempt 4 |
| **1 critic por pack** | eng: `scope` (determinista: paths tocados ⊆ `allowedPaths`) **y** `security` (`Decider` llm). accounting: `policy` (reglas de política de gastos + `Decider`) | Critic emite `warn`/`block`; solo `block` re-loopea |
| **Risk + human gate** | `RiskPolicy` = reglas del pack. `HumanGate` = Temporal signal via CLI (`factory approve/reject`). Timeout 72 h → `escalated` | `reject` con findings del humano vuelve al actor |
| **Apply draft** | eng: `github-pr` en `mode: draft` (PR draft en branch `factory/<ticketId>`). accounting: `erp-draft` escribe JSON/CSV en formato de import + (si el ERP lo permite) journal *unposted* | Idempotente: re-ejecutar `apply` no crea un 2º PR |
| **1 señal → flow hijo** | `SignalSource` `synthetic` (CLI/HTTP) para ambos, y `datadog` **stub** que solo valida config. `watch` con `MonitorPolicy` de la matriz. Señal → child `incident@1` (eng) / `adjust@1` (acct) con `parent` | Un child ticket aparece con `parent.reason` correcto |
| **CLI + eventos** | `factory submit / ticket / approve / reject / signal emit / events` | Toda la demo es CLI; no hay UI |

## 2.3 Out of scope MVP (explícito)

| Fuera | Por qué | Qué queda preparado |
|-------|---------|---------------------|
| Perf Factory completa | Requiere métricas reales + actor que proponga cambios de perf + evaluación A/B | `flows/perf.yaml` existe como ejemplo y `SignalSource` es puerto |
| Sevbot "de verdad" | Investigación multi-fuente, correlación, paging | `incident@1` solo: contexto = CI logs + diff del PR aplicado; propone, no parchea |
| Multi-repo federation | Descubrimiento, colas por repo, prioridades | `factory.yaml` es por repo; el worker carga N binding files |
| Self-improving skills | Necesita dataset de decisiones humanas (se empieza a generar en MVP) | Skills versionadas en `skills/` del repo |
| Entrenar/calibrar Jev | Mismo dataset | `Decider` port con adapter `jev` stub |
| Dark factory (0 humanos) | Fuera de la tesis conservadora | `risk.humanRequiredAbove: never` existe en el schema pero está prohibido por validación en MVP |
| `apply.mode: commit` (merge / post) | Write access real | El puerto lo soporta; la validación del schema lo rechaza si `apiVersion < factory/v2` |
| UI web | La demo es CLI + eventos | Event log queryable |
| Runners adicionales (Codex, OpenHands) | 1 real basta para el claim | `Runner` port + `noop` |
| Edición humana del artifact en el gate | UX compleja | `HumanDecision.kind: 'edit'` reservado en el tipo |

## 2.4 Lo que NO recorta el MVP (líneas rojas)

- Gates deterministas antes de critics, siempre. Un flow sin gates no valida.
- `apply` solo en `draft`.
- `requiresHuman` por defecto `true`; el flow puede bajar el umbral solo hasta `low` con reglas, nunca a `never`.
- Budgets obligatorios en todo flow (el schema no acepta flows sin `budget`).
- Runner sin secrets de escritura. Se verifica en el test de integración (el contenedor del runner no tiene `GITHUB_TOKEN` ni credenciales de ERP).
