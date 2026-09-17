# 1. Problem framing

## 1.1 Qué es

Una **plataforma interna** (no SaaS, no producto) que ejecuta de forma durable el grafo

```
intake → route → act → gates → critics → risk → apply → watch → retrigger
```

sobre un `Ticket`, con cada caja resuelta por un **plugin** declarado en `factory.yaml`.
El control plane no sabe qué es un PR ni qué es un asiento contable. Sabe qué es un
`Artifact`, un `Finding`, una `Decision<T>`, un `Budget` y un `TicketState`.

Componentes, en orden de dependencia (una capa no importa la de arriba):

```
packs/*            (eng, accounting)      ← conocen dominio, importan contracts
factory.yaml       (por repo/dominio)     ← binding: qué plugin en qué stage
control-plane      (Temporal worker)      ← intérprete del grafo, importa contracts
contracts          (@factory/contracts)   ← tipos + interfaces. No importa nada.
```

## 1.2 Qué NO es

- **No es un agente.** El agente (Claude Code, Codex, OpenHands, un clasificador LLM) es un `Runner`
  detrás de un puerto. Se puede reemplazar por `noop` y el grafo sigue corriendo.
- **No es CI.** Los gates *invocan* el CI/comando del pack y parsean su salida a `Finding[]`. No lo reemplazan.
- **No es un ERP ni un VCS.** Escribe drafts (PR draft, journal draft). Postear/mergear es `apply.mode: commit`, fuera del MVP.
- **No es un framework de prompts ni un motor de DAGs genérico.** El grafo es fijo. Un flow solo elige
  plugins por stage, config por stage y qué stages opcionales se saltean. El modelo no inventa el workflow.
- **No es un "dark factory".** En MVP siempre hay un humano antes de `apply` cuando `risk.requiresHuman`, y
  `requiresHuman` es `true` por defecto.

## 1.3 Usuarios

| Usuario | Qué hace con la fábrica | Qué le importa |
|---------|------------------------|----------------|
| **Eng** (dev / lead) | Etiqueta un issue, revisa el PR draft, aprueba en el `HumanGate`, escribe `flows/*.yaml` y skills de su repo | Que el PR llegue con gates verdes y findings ya resueltos; que no le toque un loop infinito de PRs |
| **Finance** (contador / controller) | Sube CSV de gastos, revisa `JournalDraft` con findings, aprueba/rechaza líneas | Que nada se postee sin su OK; que cada clasificación tenga evidencia; que no salgan datos sensibles a terceros sin política |
| **Platform** (owner del control plane) | Opera Temporal + workers, define budgets/lanes, publica packs, mira costo por ticket | Que agregar un pack no toque el core; que un ticket nunca gaste sin cap; observabilidad |

## 1.4 Métricas de éxito realistas — MVP 6–8 semanas vs "fábrica OpenAI"

| Métrica | MVP (6–8 sem) | Fábrica OpenAI (referencia, no objetivo) |
|---------|---------------|-----------------------------------------|
| Packs corriendo sobre el **mismo binario** | 2 (`eng`, `accounting`) | N dominios, multi-repo |
| Líneas cambiadas en `control-plane/` al agregar el 2º pack | **0** (métrica de modularidad, se mide en CI) | — |
| Issue GitHub → PR draft con gates verdes | ≥ 60 % de un set de 10 issues "chicos" en repo sandbox | Auto-merge de baja-risk |
| CSV gastos → `JournalDraft` con 100 % de gates deterministas verdes | ≥ 90 % de líneas clasificadas sin `block`; 100 % pasan balance/CoA/periodo | Month-close |
| Tickets que superan `maxAttempts` sin pasar a `escalated` | **0** | — |
| Costo por ticket visible y capeado | 100 % de tickets con `spend.usd` y `budget.maxUsd` | — |
| Tiempo intake → `awaiting_human` | mediana < 30 min (eng), < 5 min (accounting) | — |
| Señal → flow hijo | 1 señal (sintética o real) abre 1 `incident@1` o `adjust@1` con `parent` correcto | Perf Factory + Sevbot reales |
| Humanos en el loop | 1 aprobación obligatoria por ticket | Low-risk sin humano |

## 1.5 Riesgos y mitigación en el diseño

| Riesgo | Cómo lo absorbe el diseño (no una promesa) |
|--------|-------------------------------------------|
| **Loops infinitos actor↔gates** | `Budget` en el workflow: `maxAttempts`, `maxUsd`, `maxNoProgress` (mismo set de `fingerprint` de findings bloqueantes que el intento anterior = sin progreso), `maxSameRunnerAttempts` (obliga al router a cambiar de runner/modelo o escalar). Superado → `escalated`, evento, humano. Ver [05](05-control-plane.md#budgets). |
| **Write access** | El `Runner` corre sin credenciales de escritura (sandbox, token read-only o ninguno). Solo `Applier` tiene secrets, y recibe `mode` desde `factory.yaml`, no desde el ticket ni del modelo. `commit` mode requiere `HumanDecision` grabada. |
| **Calibración de risk** | En MVP `RiskPolicy` es **reglas** (paths, montos, vendor nuevo…). Toda `RiskDecision` se persiste con evidencia; el humano registra si estuvo de acuerdo. Ese log es el dataset para calibrar un `Decider` LLM/Jev después, no antes. |
| **Lock-in de runner** | `Runner.run(RunnerInput) → Artifact`. El input es findings + contexto + outcome, nunca historial de chat. Runner `noop` en MVP prueba que el grafo no depende del agente. |
| **Datos financieros** | `ContextPort` devuelve `ContextBundle` con `sensitivity` por item; `factory.yaml` declara `egress: { allowExternalLlm: false }` por defecto en accounting. Si es `false`, el `Decider` solo puede ser `rules` o un modelo local. Bloqueante: pregunta Q4. |
| **Falso sentido de seguridad por gates verdes** | `GateResult.status: 'error'` (el gate no pudo correr) no es `pass`. Un flow no puede declarar 0 gates para artifacts que se aplican. |

## 1.6 Inconsistencias del brief y cómo las resolví (interpretación conservadora)

1. **"Workflows versionados en `flows/*.yaml`" vs "un workflow parametrizado por `factory.yaml`, no uno por dominio".**
   Resolución: hay **un** workflow Temporal (`ticketWorkflow`) que interpreta un `FlowSpec`. `flows/*.yaml` son *datos*, no código de workflow. Un flow no puede reordenar stages ni agregar stages nuevos; solo bindea plugins, config y saltea stages marcados como opcionales (`critics`, `watch`). Menos expresivo, más gates.
2. **"Se asigna lane/modelo" (router elige modelo) vs "no más del mismo modelo" (cap).**
   Resolución: el router elige entre `lanes` y `runners` **declarados** en `factory.yaml`, nunca un nombre de modelo libre. El cap `maxSameRunnerAttempts` re-invoca al router con `exclude: [runnerId]`. Si no queda runner → `escalated`.
3. **"Builder define outcome → Ticket + flow" vs router que asigna flow.**
   Resolución: el intake puede *proponer* `requestedFlow`. El router lo valida contra los flows del pack y lo confirma o cambia (`Decision<RouteChoice>`). Ambos quedan en el event log.
4. **Jev: "decisiones tipadas Choice / Score / Noul".** No sé qué es "Noul"; lo interpreto como **abstención** (`Decision.value = null`). Modelado como `Decider` con tres implementaciones (`rules`, `llm-structured`, `jev`). Si Jev no está disponible en semana 1, no bloquea: `rules` cubre router/risk y `llm-structured` cubre critics.
5. **"Critics/especialistas → si falla vuelve al actor".** Un critic no "falla": emite `Finding[]`. Solo `severity: 'block'` reenvía al actor. `warn` viaja al humano con el artifact. Esto evita que un critic LLM ruidoso genere loops.
6. **MonitorPolicy "según impacto × relevancia".** Lo saqué del LLM: `RiskDecision` trae `impact` y `relevance` (enum de 3 valores cada uno, decididos por reglas en MVP), y `factory.yaml` tiene una **matriz** `monitor.matrix[impact][relevance] → MonitorProfile`. Determinista y auditable.
