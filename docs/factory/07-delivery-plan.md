# 7. Plan de entrega (7 semanas + 1 de buffer)

No asume tamaño de equipo. Está cortado para que **una persona** pueda llevar el camino crítico y una segunda pueda tomar el pack `accounting` desde la semana 4 en paralelo. Cada issue tiene un criterio de "hecho" verificable.

## 7.1 Epics y dependencias

```
E0 Decisiones + esqueleto (w1)
 └─► E1 Contratos + resolver (w1–2)
      └─► E2 Intérprete Temporal + loop con noop (w2–3)
           ├─► E3 Pack eng: act + gates + feedback (w3)
           │    └─► E4 Pack eng: critics + risk + human + apply (w4)
           │         └─► E6 Watch + señal + flow hijo (w6)  ◄── E5
           └─► E5 Pack accounting completo (w4–5, en paralelo con E4 desde que E2 cierra)
E7 Hardening + demo (w7) ◄── E4, E5, E6
w8 buffer
```

Camino crítico: E0 → E1 → E2 → E3 → E4 → E6 → E7. Accounting (E5) no está en el camino crítico: eso es deliberado; el claim de modularidad se prueba porque E5 se construye **sin tocar** `packages/control-plane`.

## 7.2 Decisiones de la semana 1 (ADRs, bloquean todo lo demás)

| ADR | Decisión | Default si nadie objeta |
|-----|----------|-------------------------|
| ADR-001 | Orchestrator | **Temporal**, dev server local en w1, self-host Postgres o Temporal Cloud en w7 (Q2) |
| ADR-002 | Runner real MVP para eng | **Claude Code headless** en contenedor sin creds (Q8). Alternativa: OpenHands si hay restricción de licencia |
| ADR-003 | Layout | **Monorepo pnpm** con `packages/{contracts,control-plane,packs/eng,packs/accounting}` + `apps/{worker,cli}`. `@factory/contracts` se publica a registry interno desde w2 para que packs externos puedan consumirlo |
| ADR-004 | Storage propio | Postgres: `tickets` + `ticket_events`. Blobs (artifacts, logs) en S3-compatible o filesystem en dev |
| ADR-005 | Egress de datos financieros | `allowExternalLlm: false` hasta respuesta de Q4. Runner accounting MVP = `rules-classifier` |
| ADR-006 | ERP target | Stub `generic-json` hasta Q3. El applier real es un issue de w5 si hay respuesta |

## 7.3 Issues por semana

### Semana 1 — E0 + E1a

| # | Issue | Hecho cuando |
|---|-------|--------------|
| 1 | ADR-001..006 escritos y aprobados | 6 archivos en `docs/adr/` con "Accepted" |
| 2 | Scaffold monorepo pnpm + CI (typecheck, test, lint) | `pnpm -r typecheck` verde en CI |
| 3 | `@factory/contracts` v0: tipos + puertos de [contracts.ts](reference/contracts.ts) | compila; `TICKET_TRANSITIONS` con test |
| 4 | `@factory/contracts`: zod `FactoryYamlZ`, `FlowYamlZ` ([factory-schema.ts](reference/factory-schema.ts)) | los ejemplos de `reference/examples/**` validan; los casos rojos (commit, sin gates) fallan en test |
| 5 | Temporal dev server + worker `factory-control` + workflow "hello ticket" que transiciona `received → closed` | `factory submit --domain demo` termina `closed`; sobrevive restart del worker |

### Semana 2 — E1b + E2a

| # | Issue | Hecho cuando |
|---|-------|--------------|
| 6 | `resolveFlow`: `factory.yaml` ⊕ `flows/*.yaml` → `FlowSpec` con `digest`; validación de `with:` contra `plugin.configSchema` | test: cambiar yaml después de `routed` no cambia el `FlowSpec` del ticket |
| 7 | `PluginRegistry` + `PackManifest` loader (`FACTORY_PACKS=`) + pack `demo` con plugins triviales | worker carga 2 packs; `registry.get()` falla claro si falta |
| 8 | Ticket projection + `ticket_events` en Postgres; activity `transition` valida `TICKET_TRANSITIONS` | `factory events <id>` lista eventos; transición ilegal = error |
| 9 | `ticketWorkflow` v0: route → act(noop) → gates(fake pass/fail configurable) → loop → assessing → applying(fs) → closed | test de integración: gate que falla 1 vez → attempt 2 → closed |
| 10 | Budgets: `maxAttempts`, `maxNoProgress` (fingerprints), `maxUsd`, `maxSameRunnerAttempts` (re-route con `exclude`) | test: gate que siempre falla → `escalated` en attempt 2 (noProgress); runner excluido tras 2 |
| 11 | CLI: `submit`, `ticket`, `events`, `approve`, `reject`, `cancel` | demo por CLI del issue 9 |

### Semana 3 — E3 (eng: act + gates)

| # | Issue | Hecho cuando |
|---|-------|--------------|
| 12 | Worker `lane:eng-default` + runner `claude-code`: contenedor efímero, checkout read-only, `RunnerInput` → prompt estructurado, `git diff` → `PatchPayload`. **Sin** `GITHUB_TOKEN` | test: el contenedor no puede `git push`; artifact `patch` válido en repo sandbox |
| 13 | Gates `command` + parsers `tsc`, `vitest`, `eslint` → `Finding[]` con `locator.file`, `fingerprint`, `Proposal` (`replace_range` desde eslint fix) | fixtures de salida real → findings esperados (snapshot) |
| 14 | `ContextPort` `git` (`repo`, `diff`) | bundle con `sensitivity: internal`, truncado por `maxBytes` |
| 15 | `FeedbackBundle` → runner: template de prompt que serializa findings + proposals; dedup por fingerprint | test: attempt 2 recibe solo findings bloqueantes nuevos |
| 16 | Intake `github-issue` (webhook o poll por label) + idempotencia por `workflowId` | mismo issue relabeled 2 veces = 1 ticket |

### Semana 4 — E4 (eng: critics + risk + human + apply) ∥ E5a (accounting arranca)

| # | Issue | Hecho cuando |
|---|-------|--------------|
| 17 | Critic `scope` (rules) + critic `security` (`Decider` `llm-structured`, solo `warn`) + chequeo de `egress` en la activity | `scope` bloquea path denegado con `revert_path`; `security` nunca emite `block` |
| 18 | `RiskPolicy` `rules` + derivación en workflow de `requiresHuman` y `MonitorPolicy` (matriz) | tabla de casos: paths/labels → level/impact/relevance/profile |
| 19 | `HumanGate` `github-pr-review` + signal `humanDecision` + validación de `approvers` + timeout → `escalated` | `factory reject --finding ...` reenvía al actor con `source.stage: human` |
| 20 | Applier `github-pr` draft, idempotente por branch (`find`) | re-run de `apply` no crea 2º PR |
| 21 | **Demo eng end-to-end** en repo sandbox con 3 issues reales | 2 de 3 llegan a `awaiting_human` con gates verdes |
| 22 | (E5) Pack accounting: intake `csv`, artifact `journal_draft` + JSON Schema, runner `noop` + `rules-classifier`, context `coa`/`vendor-master` | ticket accounting corre `received → gating` con noop |

### Semana 5 — E5b (accounting completo)

| # | Issue | Hecho cuando |
|---|-------|--------------|
| 23 | Gates builtin: `schema`, `balance`, `coa`, `period`, `vat`, `duplicate` con `Proposal` (`reclassify`, `set_field`, `drop_entry`) | fixtures de CSV con errores conocidos → findings esperados |
| 24 | Runner `llm-classifier` (structured output → `Decision<string>` por fila) **gated por `egress`**; si `allowExternalLlm=false` el router no lo elige | test: con egress false el route excluye `llm-classifier` |
| 25 | Critic `policy` (rules; Decider opcional) + `RiskPolicy` rules (vendor nuevo, umbral, cuentas sensibles) | casos de tabla |
| 26 | Applier `erp-draft` (`generic-json` + adapter stub; real si Q3 está respondida) idempotente por `externalRef` | archivo en `out/`; re-run no duplica |
| 27 | **Demo accounting end-to-end** con CSV de 50 filas sobre el **mismo binario** del issue 21 | `awaiting_human` con 100 % gates verdes; **CI job que asserta `git diff --stat packages/control-plane` = 0 entre tag `eng-demo` y `acct-demo`** |

### Semana 6 — E6 (watch + señal + hijo)

| # | Issue | Hecho cuando |
|---|-------|--------------|
| 28 | `SignalSource` `synthetic` (CLI/HTTP → Temporal signal) + `ci-status` (webhook) + `datadog`/`erp-reconciliation` stubs que validan config | `factory signal emit` llega al workflow correcto |
| 29 | Stage `watching`: subscribe, poll/push, ventana, `maxChildren`, `startChild` con `parent` + `workflowId` idempotente | señal duplicada = 1 hijo; `maxChildren` → `escalated` |
| 30 | Flows hijo `eng/incident@1` y `accounting/expense-adjust@1` corriendo con context del padre | hijo llega a `awaiting_human` con `parent.reason` correcto |
| 31 | `Decider` port: `rules`, `llm-structured`, `jev` (stub o real según Q6) detrás de router/critic/risk | swap por config; mismos tests pasan con `rules` |

### Semana 7 — E7 (hardening + demo)

| # | Issue | Hecho cuando |
|---|-------|--------------|
| 32 | Observabilidad: costo por ticket/stage/plugin (SQL), tasa de escalated, acuerdo humano vs risk; `factory stats` | 1 query por métrica de [01 §1.4](01-framing.md#14-métricas-de-éxito-realistas--mvp-68-semanas-vs-fábrica-openai) |
| 33 | Secrets por worker (`factory-io:<domain>` monta creds; `lane:*` no) + test de integración que lo verifica | test rojo si el runner ve `GITHUB_TOKEN` |
| 34 | Redaction en `ContextBundle` para `sensitivity ≥ confidential` (montos enmascarados fuera de gates) | test con CSV fixture |
| 35 | Runbook (`docs/runbook.md`): cómo enganchar un repo nuevo con el esqueleto de [06 §6.2](06-factory-yaml.md#62-esqueleto-mínimo-para-engancharse), cómo escalar, cómo leer eventos | alguien que no construyó la fábrica engancha un 3º dominio `demo` en < 1 h |
| 36 | Demo script de [02 §2.1](02-mvp.md#21-el-claim-a-demostrar) grabado y reproducible | corre de punta a punta en CI con `noop` en < 2 min |

### Semana 8 — buffer

Reservada. Si sobra: applier ERP real (Q3), `datadog` real (Q9), Jev real (Q6).

## 7.4 Criterio de "demoable"

Todo esto, en una sola sesión, con un solo binario del worker:

1. `factory submit --domain eng --intake github-issue --ref acme/sandbox#42` → ticket llega a `awaiting_human` con ≥ 1 loop de gates visible en `factory events`.
2. `factory approve` → PR draft existe en GitHub; ticket en `watching`.
3. `factory signal emit --ticket <eng> --source ci-status --metric ci.main.status --value failure` → child `eng/incident@1` creado, llega a `awaiting_human` con un PR draft que propone.
4. `factory submit --domain accounting --intake csv --ref ./expenses.csv` → `awaiting_human` con 6 gates verdes y ≥ 1 loop visible.
5. `factory approve` → `out/journal-*.json` existe; ticket en `watching`.
6. `factory signal emit --ticket <acct> --source synthetic --metric reconciliation.delta --value 120` → child `accounting/expense-adjust@1` creado.
7. `git diff --stat <eng-demo>..<acct-demo> -- packages/control-plane` imprime nada.
8. Un ticket forzado a fallar gates termina en `escalated` en el attempt 2, con `budget.exceeded { cap: maxNoProgress }` en eventos.
