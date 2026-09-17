# 5. Control plane

## 5.1 Temporal vs Inngest — recomendación: **Temporal** para el MVP TS

| Criterio | Temporal | Inngest | Peso para nosotros |
|----------|----------|---------|--------------------|
| Runner activity de 20–60 min con heartbeat | Sí, nativo (`heartbeatTimeout`, cancel cooperativo) | Steps con límite de duración; hay que partir el run o usar `step.waitForEvent` con un worker externo | **Alto**. El actor es lo más lento del grafo. |
| Lanes = colas aisladas por runner/modelo | Task queues nativas; un worker por lane, escalado independiente | Concurrency keys por función; no aísla el proceso | **Alto**. "No más del mismo modelo" y aislamiento de creds del runner se resuelven con workers distintos. |
| `watching` de días/semanas | Workflow puede vivir semanas; `condition()` + timers | `step.sleep` largo OK | Medio |
| Aprobación humana | Signals + `condition()` con timeout | `waitForEvent` con timeout | Empate |
| Flow hijo con link al padre | Child workflows, `parentClosePolicy: ABANDON` | Evento → otra función; link manual | Medio |
| Determinismo / versioning del código del workflow | Estricto (sandbox TS, `patched()`); costo de aprendizaje real | Laxo; fácil | Contra Temporal, mitigado porque el workflow es **uno** y chico |
| Infra | Dev server local (`temporal server start-dev`); prod = self-host (Postgres) o Temporal Cloud | Dev server local; prod = Inngest Cloud o self-host | Pregunta Q2 |
| Observabilidad de estado | Web UI con history por ticket; queries | Dashboard de runs | Empate |

Decisión: Temporal, porque los dos requisitos de más peso (runner largo aislado, lanes como colas con workers separados) son nativos y en Inngest son workarounds. Fallback si no hay apetito de infra en semana 1: Inngest Cloud con el **mismo** diseño (el intérprete cambia de `proxyActivities` a `step.run`, los plugins no cambian). No se abstrae el orchestrator detrás de un puerto: sería el 11º puerto y no paga.

## 5.2 Cómo se representa el grafo: un workflow, N `FlowSpec`

- Hay **un** workflow Temporal: `ticketWorkflow(input: { ticketId, flowRef, packRef })`. Ver [reference/ticket-workflow.ts](reference/ticket-workflow.ts).
- El workflow es un **intérprete** de `FlowSpec` (contracts §10). El grafo (9 stages, orden fijo) está en el código del workflow. `FlowSpec` solo dice qué plugin, con qué config, en cada stage.
- `FlowSpec` se resuelve al inicio (`resolveFlow` activity) desde `factory.yaml` + `flows/<name>.yaml` y se **pinnea** por `digest` en el ticket. Un cambio en yaml afecta tickets nuevos, nunca en vuelo.
- El código del workflow **no importa packs**. Solo `@factory/contracts` y sus activities. Las activities reciben `PluginId` + config y resuelven en el `PluginRegistry` del worker.
- Distintos dominios corren el mismo `workflowType`. Lo que cambia es `taskQueue` de las activities de `act` (la lane) y el `packRef`.

Task queues:

| Queue | Worker | Qué corre | Secrets |
|-------|--------|-----------|---------|
| `factory-control` | control worker | el workflow + activities baratas (`resolveFlow`, `transition`, `route`, `assessRisk`, `deriveMonitor`) | ninguno |
| `lane:<lane>` (ej. `lane:eng-default`) | 1 worker por lane, con el pack cargado | `runRunner` (contenedor efímero) | **ninguno de escritura** |
| `factory-io:<domain>` | io worker por dominio | `fetchContext`, `runGate`, `runCritic`, `apply`, `subscribeSignals`, `requestHuman` | los del dominio, montados solo en este worker |

Con esto "el runner no tiene credenciales" es una propiedad de deploy verificable, no de prompt.

## 5.3 Idempotencia y retries

| Qué | Mecanismo |
|-----|-----------|
| Intake duplicado (mismo issue relabeled, mismo CSV subido 2 veces) | `workflowId = ticket:<domain>:<externalRef>` + `WorkflowIdReusePolicy: REJECT_DUPLICATE` mientras esté abierto; cerrado → nuevo ticket permitido con `--force`. |
| Activity reintentada por Temporal | Toda activity es idempotente por `key = ${ticketId}:${attempt}:${stage}:${pluginId}`. Gates/critics: se re-corren (son puros). Runner: **no** se reintenta automáticamente si devolvió `ok:false` con `kind ∈ {refused, invalid_artifact, budget}`; eso es un loop de negocio, no un retry. `infra`/`timeout` → retry policy `maxAttempts: 2`. |
| Apply | `applier.find(artifact)` antes de `apply`. PR por branch name; journal draft por `externalRef`. Re-ejecución = no-op con el `ApplyRef` existente. |
| Event log | `ticket_events` con `UNIQUE(ticket_id, seq)`; `seq` lo asigna el workflow (determinista). Insert duplicado = no-op. |
| Signal subscribe | Idempotente por `(ticketId, subscription)` en el SignalSource. |
| Child ticket | `workflowId = ticket:<domain>:<parentTicketId>:<signalId>`. Misma señal dos veces = un hijo. |

## 5.4 Budgets y caps

Todos se evalúan en el workflow **antes** de cada transición a `acting`, y `maxUsd` además antes de cada stage con costo (critic LLM, runner).

| Cap | Dónde se mide | Qué pasa al superarlo |
|-----|---------------|-----------------------|
| `maxAttempts` | `spend.attempts` | `budget.exceeded` + `escalated` |
| `maxUsd` | Σ `Cost.usd` de artifacts, gates, critics | `escalated` (nunca "terminar el intento actual") |
| `maxWallClockMinutes` | desde `received` | `escalated` |
| `maxNoProgress` | `spend.noProgressStreak`: intento N con `set(fingerprints bloqueantes) == set(N-1)` | `escalated`. Default 1: dos intentos idénticos y se corta. |
| `maxSameRunnerAttempts` | `spend.sameRunnerStreak` | re-`route` con `exclude: [runner]`; sin alternativa en `allowed.runners` → `escalated` |
| `humanTimeoutHours` | timer en `awaiting_human` | `escalated` con `to: approvers` |
| `monitor.maxChildren` | `childTicketIds.length` | `watching → escalated` (tormenta) |

Escalate siempre = evento `ticket.escalated` + `HumanGate.request` con el estado. Nunca reintento silencioso.

## 5.5 Aprobación humana

1. `assessing` → workflow deriva `requiresHuman = humanRequiredAbove === 'always' || level > humanRequiredAbove || acceptance.length === 0 || anyFinding(severity='warn' && source='critic')` (conservador). Con `humanRequiredAbove: low`, un ticket `low` sin warns y con acceptance explícita puede aplicar en draft sin humano; `medium`/`high` siempre pasan por humano.
2. `requestHuman` activity → `HumanGate.request` (comenta en PR / manda mensaje / imprime en CLI).
3. Workflow hace `await condition(() => humanDecision !== undefined, humanTimeout)`. La decisión entra por signal `humanDecision(HumanDecision)`; el CLI `factory approve|reject` la manda.
4. `approve` → `applying`. `reject` → findings al `FeedbackBundle` con `source.stage:'human'` → `acting`. `defer` → re-arma el timer. `edit` → reservado.
5. Quién puede aprobar: `flow.stages.risk.approvers` (lista o `@codeowners`). El signal trae `by`; el workflow valida contra la lista. Fuera de lista = evento `human.decided` rechazado y se sigue esperando.

## 5.6 Qué NO va en LangGraph ni en el coding agent

| Responsabilidad | Vive en | Nunca en |
|-----------------|---------|----------|
| Máquina de estados del ticket | `ticketWorkflow` | agente / LangGraph |
| Retries, timeouts, heartbeats | Temporal | agente |
| Caps y budget | workflow | prompt ("intentá máximo 3 veces") |
| Elegir flow / lane / runner | `Router` con `allowed` | agente |
| Decidir si hace falta humano | workflow (regla) | `RiskPolicy` LLM |
| Credenciales de escritura | worker `factory-io` / `Applier` | contenedor del runner |
| Subscribirse a métricas, abrir hijos | workflow + `SignalSource` | agente "que se queda mirando" |
| Parsear salida de tsc/vitest | gate parser (código) | agente que "lee el error" |

LangGraph (o cualquier agent framework) puede vivir **adentro** de un `Runner` o de un `Critic`. Es un detalle de implementación del plugin. Si un día queremos un runner multi-agente, es otro `Runner`; el grafo externo no cambia.

## 5.7 Observabilidad mínima MVP

- Temporal Web UI: history por `workflowId = ticket:*`.
- Tabla `ticket_events`: `factory events <ticketId>` la lista. Métricas derivadas por SQL: costo por ticket/stage/plugin, attempts, tiempo por stage, tasa de `escalated`, acuerdo humano vs risk.
- Logs de runner y gates a blob store con `logsRef` en el evento. No se guardan en Postgres.
