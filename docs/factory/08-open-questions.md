# 8. Preguntas al humano (bloquean scope)

Ordenadas por cuánto cambian el plan. Cada una tiene el default con el que sigo si no hay respuesta en semana 1.

| # | Pregunta | Por qué bloquea | Default conservador |
|---|----------|-----------------|---------------------|
| **Q1** | ¿TS-only para control plane **y** packs, o habrá packs en Python (ej. accounting con pandas)? | Si hay packs no-TS, `@factory/contracts` tiene que publicar JSON Schema + un protocolo de plugin out-of-process (HTTP/stdio) desde w2, no solo tipos TS | TS-only. JSON Schemas se generan de zod igual (barato), protocolo out-of-process post-MVP |
| **Q2** | ¿Hay Temporal disponible (Cloud o self-host) y Postgres para el event log? ¿O hay que levantar todo? | Define w1 (ADR-001) y w7 (deploy). Sin Temporal y sin apetito de infra → Inngest Cloud con el mismo diseño | Temporal dev server local hasta w6; decisión de prod en w7 |
| **Q3** | ¿Qué ERP (Odoo, SAP B1, NetSuite, Xero, QuickBooks, custom)? ¿Tiene API para crear journals **unposted**/draft? | Define el applier `erp-draft` real vs stub JSON, y si `watch` puede leer reconciliación real | Stub `generic-json` en `out/`. El demo accounting no toca ERP |
| **Q4** | ¿Los datos de gastos (vendor, montos, descripciones) pueden salir a APIs externas (Anthropic/OpenAI/Jev)? ¿Con enmascarado? ¿Con DPA firmado? | Si no: el runner accounting es `rules-classifier` (vendor master + heurísticas) y el critic `policy` es solo reglas. Cambia la calidad esperada de clasificación | `allowExternalLlm: false`. Runner rules-only |
| **Q5** | ¿Quién puede aprobar por dominio? ¿Existe CODEOWNERS en el repo eng y una matriz de aprobación en finance? | `risk.approvers` y validación del signal `humanDecision`. Sin lista, cualquiera aprueba | Lista explícita de 1–2 personas por dominio en `factory.yaml` |
| **Q6** | ¿Tenemos acceso a la API de Jev hoy? ¿Qué firma tiene (Choice/Score/abstención)? ¿"Noul" = abstención? | Define si el adapter `jev` del `Decider` es real o stub en w6 | Stub. `rules` + `llm-structured` cubren MVP |
| **Q7** | ¿Cuál es el repo sandbox para la demo eng? ¿Tiene `pnpm typecheck/test/lint` funcionando y CI en GitHub Actions? | Gates `command` y `ci-status` dependen de eso. Un repo sin tests no demuestra el loop | Crear `acme/factory-sandbox` con 3 issues sembrados en w3 |
| **Q8** | ¿Runner preferido: Claude Code headless, Codex CLI, OpenHands? ¿Restricciones de licencia/red para correr LLM en contenedor? | ADR-002; afecta w3 entera | Claude Code headless |
| **Q9** | ¿Hay fuente real de señales (Datadog/Grafana/Sentry) con API accesible, y CI en `main` que se pueda observar? | Si no, `watch` en la demo es 100 % sintético (aceptable para MVP, pero hay que decirlo) | `synthetic` + `ci-status`; `datadog` stub |
| **Q10** | ¿Dónde vive el `factory.yaml` de accounting? ¿Finance acepta un repo git (`finance-factory`) con CoA/vendors/policies versionados? | Si Finance no usa git, hace falta otra fuente de config (bucket/UI) y eso es scope nuevo | Repo `finance-factory`, PRs los hace Platform en nombre de Finance |
