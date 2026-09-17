# 3. Domain model

Fuente de verdad: [reference/contracts.ts](reference/contracts.ts). Este doc explica el *por qué* de cada tipo, no repite los campos.

## 3.1 Tipos canónicos (qué cruza el límite control plane ↔ plugin)

| Tipo | Quién lo produce | Quién lo consume | Nota de diseño |
|------|------------------|------------------|----------------|
| `Domain`, `FlowId` | `factory.yaml` / resolver | todos | `FlowId = domain/name@version`. Inmutable. Cambiar un flow = nueva versión. Tickets en vuelo quedan pinneados por `flowDigest`. |
| `Ticket` | workflow (proyección) | CLI, humanos, router | Es una **proyección** del event log. Nunca se edita a mano. `version` para concurrencia optimista en la tabla. |
| `Decision<T>` | Router, Critic (interno), RiskPolicy, Decider | workflow, auditoría | `value: null` = abstención (Jev "Noul"). `reasons` son para humanos, **nunca** viajan al actor. |
| `Finding` | Gate, Critic, HumanDecision.reject, Signal | FeedbackBundle → Runner; humano | `fingerprint` habilita el cap de "mismos findings repetidos". `code` namespaced y estable para métricas. |
| `Proposal` | quien emite el Finding | Runner | Tipada: `replace_range`, `set_field`, `reclassify`, … o `${domain}/${kind}` validada por el pack. `replan` es la única "no mecánica". |
| `Artifact<K,P>` | Runner | Gate, Critic, Risk, Applier, Human | Kinds core: `patch`, `journal_draft`. `digest` = clave de idempotencia de apply. `cost` viaja adentro. |
| `GateResult` | Gate | workflow | `status: 'error'` ≠ `pass`. Un gate que no corre bloquea. |
| `RiskDecision` | workflow (compone RiskPolicy + matriz) | HumanGate, Applier, watch | `requiresHuman` y `monitor` los deriva el **workflow** por reglas de `factory.yaml`, no el `RiskPolicy`. Así un LLM en risk no puede auto-eximirse de humano. |
| `MonitorPolicy` | matriz `monitor.matrix[impact][relevance]` | SignalSource, watch | `maxChildren` capea tormentas de flows hijos. |
| `Budget` / `Spend` | flow yaml / workflow | workflow | Ver [05 §budgets](05-control-plane.md#54-budgets-y-caps). |
| `HumanDecision` | humano via CLI/UI → Temporal signal | workflow | `reject` lleva `Finding[]`: el humano habla el mismo idioma que los gates. |
| `Signal` | SignalSource | workflow → child ticket | Siempre referencia la `SignalSubscription` que matcheó. |
| `PackManifest`, `FlowSpec` | pack npm / resolver | control plane | El control plane solo ve `PluginId`s y config. Nunca importa un pack en el código del workflow. |

## 3.2 Estados del ticket

```
                     ┌──────────── reject (findings) ─────────────┐
                     │                                             │
received → routed → acting → gating → reviewing → assessing → awaiting_human → applying → applied → watching → closed
              ▲       ▲  │      │         │            │                                        │
              │       │  │  fail│     block│        low & !human                                │ signal → child ticket
              │       │  └──────┴──────────┘             └──────────► applying                  │ (parent sigue watching)
              │       │  (attempt+1, si budget lo permite)                                      ▼
              │       │                                                                   window expira → closed
              │       └── re-route con exclude (cap maxSameRunnerAttempts)
              │
   cualquier cap superado / runner infra fail x N / human timeout ──────► escalated ──(HumanDecision)──► acting | closed
   error no recuperable ────────────────────────────────────────────────► failed    ──(HumanDecision)──► acting | closed
   cancel explícito ────────────────────────────────────────────────────► cancelled
```

Transiciones legales: `TICKET_TRANSITIONS` en contracts.ts. El workflow lanza si se pide una transición no listada; es un bug de control plane, no un caso de negocio.

Reglas que no son obvias del diagrama:

- `gating → acting` y `reviewing → acting` son los **únicos** loops. Ambos pasan por el chequeo de budget antes de la transición.
- `assessing → applying` directo solo si `risk.level ≤ humanRequiredAbove` y no hay otra regla que fuerce humano (ver [05 §5.5](05-control-plane.md#55-aprobación-humana)). En MVP `humanRequiredAbove` es `low` o `always` (nunca `never`), así que cualquier `medium`/`high` pasa por humano.
- `awaiting_human → acting` (reject) cuenta como intento y sus findings entran al `FeedbackBundle` con `source.stage: 'human'`.
- `applied → watching` solo si `MonitorPolicy.mode !== 'none'`. Si es `none`, va directo a `closed`.
- `watching` no se sale por señal: la señal **abre un hijo** y el padre sigue en `watching` hasta que expira `windowMinutes` o alcanza `maxChildren` (→ `escalated`).
- `escalated` y `failed` son terminales *para el workflow automático*. Solo una `HumanDecision` los saca.

## 3.3 Qué va en el ticket vs qué es evento

Criterio: **el ticket contiene lo que un router, un humano o un flow hijo necesita para decidir ahora**. Todo lo demás es evento.

| Va en `Ticket` (proyección) | Es `TicketEvent` (append-only) |
|-----------------------------|--------------------------------|
| `state`, `attempt`, `spend` (agregados) | cada `ticket.transitioned` con `reason` |
| `route` (última `Decision<RouteChoice>`) | `route.decided` de cada intento, con `excluded` |
| `currentArtifactId` | `artifact.produced` (todos, con payload por referencia) |
| `lastRisk` | `risk.assessed` de cada intento |
| `applyRef` | `apply.completed`, `human.requested`, `human.decided` |
| `parent`, `childTicketIds` | `signal.received`, `child.spawned` |
| `budget` (inmutable tras `routed`) | `budget.exceeded` con el cap concreto |
| `flowId`, `flowDigest` | `gate.completed`, `critic.completed`, `feedback.sent` (findings completos) |

Consecuencias prácticas:

- Findings **no** viven en el ticket. Viven en eventos y el workflow los recompone en `FeedbackBundle`. Evita que el ticket crezca sin límite en loops.
- El costo se acumula en `spend` pero cada `Cost` individual está en el evento del stage que lo generó. Costo por stage y por plugin sale de una query.
- La tabla `ticket_events (ticket_id, seq, at, actor, event jsonb)` + `tickets (id, version, …)` es todo el storage propio. Temporal guarda su history aparte; no se usa como base de datos de consulta.
