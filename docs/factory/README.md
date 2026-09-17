# Software Factory modular — scope y plan de entrega

> Estado: **scoping**, no implementación. Fecha: 2026-09-17.
> Idioma: español. Nombres de tipos, archivos y campos en inglés.

Este directorio acota y descompone un **control plane agnóstico a proyecto y dominio**
para ejecutar workflows de "fábrica" (intake → route → act → gates → critics → risk →
apply → watch → retrigger) con packs de dominio intercambiables (`eng`, `accounting`).

## Orden de lectura

| # | Archivo | Qué responde |
|---|---------|--------------|
| 1 | [01-framing.md](01-framing.md) | Qué es / no es, usuarios, métricas de éxito MVP, riesgos, inconsistencias del brief |
| 2 | [02-mvp.md](02-mvp.md) | El corte mínimo que demuestra "mismo control plane, distinto pack". In / out of scope |
| 3 | [03-domain-model.md](03-domain-model.md) | Tipos canónicos, estados del ticket, ticket vs evento |
| 4 | [04-ports-and-packs.md](04-ports-and-packs.md) | Los 10 puertos y los dos packs (`eng`, `accounting`) stage por stage |
| 5 | [05-control-plane.md](05-control-plane.md) | Temporal vs Inngest, el workflow intérprete, idempotencia, budgets, aprobación humana |
| 6 | [06-factory-yaml.md](06-factory-yaml.md) | Schema de `factory.yaml` y `flows/*.yaml` con ejemplos |
| 7 | [07-delivery-plan.md](07-delivery-plan.md) | Epics, issues semanales, dependencias, decisiones de semana 1, criterio de demoable |
| 8 | [08-open-questions.md](08-open-questions.md) | Las 10 preguntas que bloquean scope |

## Referencia (código y yaml, no prosa)

| Archivo | Contenido |
|---------|-----------|
| [reference/contracts.ts](reference/contracts.ts) | `@factory/contracts`: tipos canónicos + interfaces de los puertos. Compila con `tsc --noEmit`. |
| [reference/factory-schema.ts](reference/factory-schema.ts) | Schema (zod) de `factory.yaml` y `flows/*.yaml`. No compilado acá (registry npm bloqueado); los ejemplos se verificaron con un chequeo estructural equivalente. |
| [reference/ticket-workflow.ts](reference/ticket-workflow.ts) | Pseudo-implementación del único workflow Temporal (intérprete del grafo). Compila con `tsc --noEmit` contra contracts.ts (API Temporal stubeada). |
| [reference/examples/eng/](reference/examples/eng/) | `factory.yaml` + `flows/{codegen,incident,perf}.yaml` para el pack eng |
| [reference/examples/accounting/](reference/examples/accounting/) | `factory.yaml` + `flows/{expense-classify,expense-adjust}.yaml` para el pack accounting |

## Resumen ejecutivo (5 líneas)

1. **No hay superagente.** Hay un intérprete durable de un grafo fijo de 9 stages, y en cada stage un plugin resuelto por `factory.yaml`.
2. **El actor nunca escribe a prod.** Produce un `Artifact` (`Patch`, `JournalDraft`). Solo `Applier` tiene credenciales y en MVP solo corre en modo `draft`.
3. **Un solo canal de feedback:** `Finding[]` con `Proposal` tipada. Gates, critics, humanos y señales hablan ese idioma; el actor lo consume, nunca prosa libre.
4. **Caps en el workflow, no en el modelo:** intentos, USD, findings repetidos (fingerprint), mismo modelo. Superado un cap → `escalated`, nunca reintento silencioso.
5. **Packs son paquetes npm** (código: plugins + schemas de artifact/proposal). `factory.yaml` es la *binding* por repo/dominio. Agregar un pack = 0 líneas en el control plane. Esa es la métrica de modularidad.
