# 4. Ports y packs

## 4.1 Los 10 puertos

Un puerto por caja del diagrama. Interfaces en [reference/contracts.ts §9](reference/contracts.ts). Resumen de contrato y de qué **no** puede hacer cada uno:

| Puerto | Firma (resumida) | Puede tener LLM/Jev | Recibe secrets | Prohibido |
|--------|------------------|---------------------|----------------|-----------|
| `IntakeAdapter` | `parse(raw) → TicketSeed \| ignore` | no | solo de lectura de la fuente | decidir flow (solo `requestedFlow`) |
| `Router` | `route({ticket, allowed, exclude}) → Decision<RouteChoice>` | sí (Decider) | no | elegir algo fuera de `allowed` |
| `Runner` | `run(RunnerInput) → Artifact \| typed failure` | es el LLM | **nunca** | escribir fuera de `workdir`; llamar a apply |
| `ContextPort` | `fetch(ContextQuery) → ContextBundle` | no | lectura | mutar |
| `Gate` | `check(artifact) → GateResult` | **no** | no | emitir `pass` sin correr |
| `Critic` | `review({artifact, gates, context}) → Finding[]` | sí (Decider) | no | bloquear sin `Proposal` o `replan` |
| `RiskPolicy` | `assess(...) → {level, impact, relevance}` | sí (Decider) | no | setear `requiresHuman` (lo deriva el workflow) |
| `Applier` | `apply(artifact, mode) → ApplyRef`; `find(artifact)` | no | **sí** | ignorar `mode`; aplicar sin `find` previo |
| `SignalSource` | `subscribe(policy) → handle`; `poll?`; `unsubscribe` | no | sí (lectura de métricas) | abrir tickets (eso lo hace el workflow) |
| `HumanGate` | `request(...) → requestRef` | no | canal (Slack/GitHub) | resolver por sí mismo; la respuesta es un Temporal signal |

`Decider` (opcional, [§1 de contracts](reference/contracts.ts)) es la abstracción *dentro* de Router/Critic/RiskPolicy: `choose<T>` y `score`. Implementaciones: `rules` (MVP), `llm-structured` (MVP, critic security), `jev` (stub MVP, real si hay acceso). Es donde vive Jev; no en gates.

Regla de egress: si `ContextBundle.sensitivity > flow.egress.maxSensitivity` o `flow.egress.allowExternalLlm = false`, el workflow **no** invoca deciders `llm`/`jev` externos y el critic cae a `rules` o se saltea con `GateResult`-like `error` (que bloquea). Esto es código del workflow, no una convención.

## 4.2 Pack = paquete npm, `factory.yaml` = binding

Un pack exporta un `PackManifest`: plugins + JSON Schemas de sus artifact kinds y proposal kinds. **No** contiene `factory.yaml`. El repo/dominio que se engancha escribe su `factory.yaml` eligiendo plugins del pack y configurándolos. Un mismo pack sirve N repos.

```
packages/
  contracts/                 @factory/contracts
  control-plane/             worker Temporal + resolver + CLI       (no importa packs)
  packs/eng/                 @factory/pack-eng     → PackManifest
  packs/accounting/          @factory/pack-accounting
apps/
  worker/                    carga packs por config: FACTORY_PACKS="@factory/pack-eng,@factory/pack-accounting"
```

El worker registra `packs[].plugins.*` en un `PluginRegistry` por `(domain, stage, id)`. Las activities resuelven `registry.get(domain, 'gate', 'typecheck')`. El código del workflow solo ve strings.

## 4.3 Pack `eng`

Artifact kind: `patch`. Flows: `codegen@1`, `incident@1`, `perf@1`.

| Stage | Plugin(s) MVP | Detalle | Fuera de MVP |
|-------|---------------|---------|--------------|
| **intake** | `github-issue` | Webhook `issues.labeled` con label `factory`. `externalRef = owner/repo#n`. `outcome.goal` = título; `acceptance` = checklist del body (`- [ ]`). Sin checklist → `acceptance: []` y el router obliga `humanRequiredAbove: always`. | `slack`, `linear`, `jira` |
| | `cli` | `factory submit --domain eng --goal "..." --accept "..."` para demo/tests | |
| **route** | `rules` | Tabla en `factory.yaml`: labels → flow; tamaño estimado (nº de paths en body) → lane `eng-default` / `eng-heavy`. `exclude` respetado. | `jev` como Decider |
| **act** | `claude-code` | Contenedor efímero con checkout read-only + branch local. Corre `claude -p` con skill `skills/codegen.md` + `RunnerInput` serializado como prompt estructurado. Devuelve `git diff` como `PatchPayload`. Sin `GITHUB_TOKEN`. | `codex`, `openhands` |
| | `noop` | Devuelve un patch fixture del repo (`fixtures/patch.diff`) | |
| **context** | `git` | `{kind:'repo'}`: árbol + archivos matcheados por globs; `{kind:'diff'}` para incident | `docs` (Confluence/Notion), `datadog` (perf) — stubs en MVP |
| **gates** | `command` ×3 | `typecheck: pnpm typecheck` parser `tsc`; `test: pnpm test -- --reporter=json` parser `vitest`; `lint: pnpm lint -f json` parser `eslint`. Cada parser → `Finding[]` con `locator.file` y `Proposal` cuando es mecánica (eslint `--fix` → `replace_range`). | `build`, `e2e` |
| **critics** | `scope` (rules) | `touchedPaths ⊆ allowedPaths` y `∉ deniedPaths` (`migrations/**`, `infra/**`). Violación → `block` + `revert_path`. | `data`, `infra`, `cloud` |
| | `security` (llm-structured) | Decider `choose` sobre categorías OWASP-lite por hunk. Solo `warn` en MVP (nunca `block`): baja el ruido, sube el humano. | `jev` |
| **risk** | `rules` | `level = high` si toca `deniedPaths`-adyacentes (`auth/**`, `payments/**`) o diff > 400 líneas o tests eliminados; `medium` si sin tests nuevos; `low` resto. `impact` = por path; `relevance` = por label (`hotfix` → high). | Decider LLM calibrado |
| **human** | `github-pr-review` | Pide review en el PR draft + comenta findings. Decisión llega por `factory approve/reject` (CLI) o webhook `pull_request_review`. | Slack |
| **apply** | `github-pr` | `mode: draft`: branch `factory/<ticketId>`, push, PR draft. `find()` busca PR por branch. Con `commit` (no MVP) haría merge. | `commit` |
| **signals** | `synthetic` | `factory signal emit`. | `datadog`, `sentry`, `ci-status` (webhook `check_suite` en main) |
| **watch** | perfil `post-merge` | passive 60 min, sub `ci.main.status neq success → incident@1` | `perf` con p95 |

Flows:

- `codegen@1`: el loop completo.
- `incident@1` (hijo): `outcome.goal = "Explain and propose fix for <signal>"`; context = diff aplicado + logs; **gates iguales**; `apply.mode: draft`; `humanRequiredAbove: always`. Propone, no parchea prod.
- `perf@1` (hijo, ejemplo, no demo MVP): igual con context `datadog` y critic `perf-regression` (out).

## 4.4 Pack `accounting`

Artifact kind: `journal_draft`. Flows: `expense-classify@1`, `expense-adjust@1`. Alcance: **clasificación de gastos** (no month-close).

| Stage | Plugin(s) MVP | Detalle | Fuera de MVP |
|-------|---------------|---------|--------------|
| **intake** | `csv` | Path/URL a CSV con columnas mínimas `row_id,date,vendor,amount,currency,description[,tax_code]`. `externalRef = sha256(file)`. `sensitivity: 'confidential'`. | `email`, `erp-inbox` |
| **route** | `rules` | Todo a `expense-classify@1`, lane `acct-default`. Si `rows > 500` → lane `acct-batch`. | |
| **act** | `llm-classifier` | Por fila: `Decider.choose(account ∈ CoA filtrado por tipo de vendor)` con structured output → `JournalEntry.classification: Decision<string>`. Si `egress.allowExternalLlm=false` → runner `rules-classifier` (vendor-master lookup + fallback a `unclassified`). Genera `JournalDraftPayload`. | `jev` |
| | `noop` | Fixture `fixtures/journal.json` | |
| **context** | `coa` | Chart of accounts (CSV/JSON en repo del dominio) | ERP API |
| | `vendor-master` | vendor → cuenta default, país, VAT | |
| | `prior-classifications` | últimas N clasificaciones aprobadas por vendor (del event log propio) | |
| **gates** | `schema` | payload valida contra JSON Schema del pack | |
| | `balance` | Σ debit = Σ credit por entry (2 decimales). Fail → `block` + `replan` | |
| | `coa` | cada `account` existe y está activa. Fail → `block` + `reclassify` (cuenta default del vendor si hay) | |
| | `period` | `date` ∈ período abierto. Fail → `block` + `set_field(date)` o `drop_entry` | |
| | `vat` | `taxCode` válido para país del vendor y monto consistente. Fail → `block` + `set_field(taxCode)` | |
| | `duplicate` | mismo vendor+amount+date en ±3 días vs prior. → `warn` + `drop_entry` (el humano decide) | |
| **critics** | `policy` (rules + Decider) | Política de gastos: categorías prohibidas, límites por categoría, requiere cost center. `block` solo por regla; el Decider solo agrega `warn` con confidence. | `anomaly` (historial por vendor) |
| **risk** | `rules` | `high` si vendor nuevo, o Σ amount > umbral, o cuenta ∈ `sensitiveAccounts` (capex, intercompany); `medium` si algún `warn`; `low` resto. `impact` por Σ amount; `relevance` por cuentas tocadas. | |
| **human** | `cli` | `factory approve/reject`. `reject` con findings por `entryId`. | Slack, UI |
| **apply** | `erp-draft` | `mode: draft`: escribe `out/journal-<period>-<ticketId>.json` en formato de import del ERP y, si el adapter ERP lo soporta, crea un journal *unposted*. `find()` por `externalRef`. | `commit` = post |
| **signals** | `synthetic` | `factory signal emit --metric reconciliation.delta` | `erp-reconciliation` (delta cuenta vs banco), `budget-variance` |
| **watch** | perfil `post-draft` | active 7 días, poll diario; sub `reconciliation.delta delta_gt 100 → adjust@1` | |

Flows:

- `expense-classify@1`: el loop completo.
- `expense-adjust@1` (hijo): `outcome.goal = "Propose adjusting entries for <signal>"`; context = draft padre + señal; mismos gates; `humanRequiredAbove: always`; `apply: draft`.

## 4.5 Lo que ambos packs comparten sin saberlo

- Misma `FeedbackBundle` al actor. El runner de accounting recibe `reclassify`/`set_field`; el de eng recibe `replace_range`/`revert_path`. Ninguno recibe prosa.
- Mismo `Budget` shape. Distintos valores en cada flow yaml.
- Mismo `HumanDecision`. Mismo CLI.
- Misma matriz de monitor. Distintos perfiles.
- Mismo test de integración: `noop` runner + gates reales + apply draft en filesystem → el grafo completo corre en CI en < 30 s por pack.
