# COVERAGE — trazabilidad del backlog del founder

> Cada línea del [backlog original](BACKLOG_ORIGINAL.md), en su orden y con su texto literal en inglés, mapeada al documento y la sección donde se diseña, a la fase del [ROADMAP](ROADMAP.md) en que se entrega y a la decisión de construir, comprar o integrar ([BUILD_VS_BUY.md](BUILD_VS_BUY.md)). Los encabezados temáticos son nuestros: el backlog original es una lista plana.

## Resumen

- **Líneas del backlog:** 383 (370 features + 13 categorías de proveedores de la factura del founder).
- **Duplicados en el backlog:** 17 líneas repiten (literalmente o en esencia) una anterior; se marcan con *(duplicado, ver arriba)* y apuntan a la original. **Items únicos: 366.**
- **Huecos:** ninguno abierto. Las 3 líneas que tenían cobertura parcial y las 6 inconsistencias entre documentos encontradas al trazar están resueltas; ver [Huecos e inconsistencias resueltos](#huecos-e-inconsistencias-resueltos). Ninguna línea queda sin documento.

**Por fase** (fase en la que la línea queda entregada; si arranca antes, la celda *Dónde* lo indica):

| Fase | Lema | Items únicos | Todas las líneas |
|---|---|--:|--:|
| 0 | Cimientos: *"a newsletter you can trust"* (meses 0–3) | 57 | 58 |
| 1 | *"Substack-parity+"* (meses 3–9) | 116 | 123 |
| 2 | Crecimiento + IA (meses 9–15) | 98 | 104 |
| 3 | Monetización amplia (meses 15–24) | 95 | 98 |
| **Total** | | **366** | **383** |

**Por decisión** (items únicos / todas las líneas):

| Decisión | Items únicos | Todas las líneas |
|---|--:|--:|
| Build | 300 | 316 |
| Híbrido | 32 | 32 |
| Buy | 21 | 21 |
| Integración | 7 | 8 |
| Operación | 6 | 6 |
| **Total** | **366** | **383** |

**Por bloque temático:**

| Bloque | Líneas |
|---|--:|
| [1. Entregabilidad, infraestructura de envío y datos del suscriptor](#1-entregabilidad-infraestructura-de-envío-y-datos-del-suscriptor) | 22 |
| [2. Editor](#2-editor) | 37 |
| [3. API REST y Send API](#3-api-rest-y-send-api) | 16 |
| [4. Servidor MCP e IA conversacional](#4-servidor-mcp-e-ia-conversacional) | 17 |
| [5. Equipo, roles y acceso](#5-equipo-roles-y-acceso) | 16 |
| [6. Website builder](#6-website-builder) | 18 |
| [7. Automatizaciones](#7-automatizaciones) | 16 |
| [8. Productos digitales](#8-productos-digitales) | 16 |
| [9. Webinars](#9-webinars) | 15 |
| [10. Comunidad](#10-comunidad) | 16 |
| [11. Podcast](#11-podcast) | 16 |
| [12. Segmentos](#12-segmentos) | 15 |
| [13. Webhooks](#13-webhooks) | 16 |
| [14. Encuestas y polls](#14-encuestas-y-polls) | 15 |
| [15. Plantillas](#15-plantillas) | 15 |
| [16. Ad network y patrocinios](#16-ad-network-y-patrocinios) | 14 |
| [17. Suscripciones de pago](#17-suscripciones-de-pago) | 14 |
| [18. Red de recomendaciones](#18-red-de-recomendaciones) | 13 |
| [19. Magic links de suscripción](#19-magic-links-de-suscripción) | 10 |
| [20. Login de lectores](#20-login-de-lectores) | 6 |
| [21. Formularios de suscripción](#21-formularios-de-suscripción) | 15 |
| [22. Link-in-bio](#22-link-in-bio) | 15 |
| [23. Analítica](#23-analítica) | 15 |
| [24. Integraciones y soporte](#24-integraciones-y-soporte) | 2 |
| [25. Las 13 categorías de proveedores](#25-las-13-categorías-de-proveedores) | 13 |

### Leyenda

- **Feature (original)**: texto literal del backlog, sin traducir ni corregir.
- **Dónde se diseña**: enlace al documento y a la sección (anclas de GitHub). El primer enlace es el diseño principal; los siguientes, complementos. Tras el guion, notas breves.
- **Fase**: 0–3 según [ROADMAP.md](ROADMAP.md). Cuando el ROADMAP no nombra la línea explícitamente, la fase se infiere de su módulo y la celda *Dónde* dice *fase inferida*.
- **Build**: código propio (aunque corra sobre infraestructura comprada u OSS como KumoMTA, Tiptap o Temporal Cloud).
- **Buy**: el valor lo da un proveedor (Stripe, LiveKit/Mux, Cloudflare, PostHog…); nosotros solo integramos y configuramos.
- **Híbrido**: una pieza comprada más una capa propia que es la que diferencia (p. ej. Turnstile + scoring propio, Claude + semantic layer).
- **Integración**: conector con un servicio de terceros que el creador ya usa (Discord, Luma, Linktree, Cal.com, GA4…).
- **Operación**: no es software sino personas, procesos o efecto de red (equipo de entregabilidad, ventas de la ad network, soporte).
- ⚠️: cobertura parcial (hoy no queda ninguna; histórico en [Huecos e inconsistencias resueltos](#huecos-e-inconsistencias-resueltos)).
- *(duplicado, ver arriba)*: la línea repite otra anterior del backlog; hereda su diseño (la fase puede diferir si el contexto llega más tarde).

---


## 1. Entregabilidad, infraestructura de envío y datos del suscriptor

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| 99.3% email delivery rate (industry-leading) | [DELIVERABILITY.md §14.2](DELIVERABILITY.md#142-qué-significa-99--y-cómo-se-alcanza) · [ARCHITECTURE.md §13](ARCHITECTURE.md#13-observabilidad-y-slos) — objetivo ≥ 99,0 % en F0; el 99,3 % es criterio de salida de F2 | 2 | Build |
| team of deliverability experts with decades of experience | [DELIVERABILITY.md §15.1](DELIVERABILITY.md#151-equipo) · [ROADMAP.md Top 10 riesgos](ROADMAP.md#top-10-riesgos) | 0 | Operación |
| infrastructure to send 3M+ emails per minute | [ARCHITECTURE.md §8](ARCHITECTURE.md#8-pipeline-de-envío-a-3mmin) · [DELIVERABILITY.md §1.2](DELIVERABILITY.md#12-topología) — arquitectura horizontal desde F0 (100k/min); 3M/min es criterio de salida de F3 | 3 | Build |
| validating every single email submission (1st and 3rd party) | [DELIVERABILITY.md §10](DELIVERABILITY.md#10-validación-de-emails-1st-party-y-3rd-party) · [BUILD_VS_BUY.md §9](BUILD_VS_BUY.md#9-email-validation--build--kickbox-para-importaciones-grandes-al-principio) — propia + Kickbox solo para importaciones grandes | 0 | Híbrido |
| automated bot-detection to prevent spam signups | [DELIVERABILITY.md §11.1](DELIVERABILITY.md#111-detección-de-altas-bot-y-rate-limiting) · [GROWTH_AND_MONETIZATION.md §2.4](GROWTH_AND_MONETIZATION.md#24-pipeline-de-alta-común-a-formularios-popups-link-in-bio-y-lead-magnets) · [BUILD_VS_BUY.md §8](BUILD_VS_BUY.md#8-bot-protection--híbrido-cloudflare-delante--scoring-propio) — Turnstile/WAF comprados + scoring propio | 0 | Híbrido |
| registering for every mailbox provider's feedback program | [DELIVERABILITY.md §7](DELIVERABILITY.md#7-feedback-loops-y-su-ingesta) | 0 | Operación |
| ingesting data from said feedback loops and building suppression lists | [DELIVERABILITY.md §7](DELIVERABILITY.md#7-feedback-loops-y-su-ingesta) · [DELIVERABILITY.md §9](DELIVERABILITY.md#9-supresión-tres-capas-temporal-y-permanente) | 0 | Build |
| tagging every email so gmail reports complaint rates per newsletter | [DELIVERABILITY.md §6.2](DELIVERABILITY.md#62-feedback-id-para-gmail) | 0 | Build |
| classifying every bounce (hard, soft, mailbox full, DNS failure) and knowing which ones mean "try again" vs. "never again" | [DELIVERABILITY.md §8.1](DELIVERABILITY.md#81-tabla-de-clasificación) | 0 | Build |
| three layers of suppression: global, per-publication, and transactional | [DELIVERABILITY.md §9](DELIVERABILITY.md#9-supresión-tres-capas-temporal-y-permanente) | 0 | Build |
| temporary suppressions that expire on their own, and permanent ones that never do | [DELIVERABILITY.md §9](DELIVERABILITY.md#9-supresión-tres-capas-temporal-y-permanente) | 0 | Build |
| one-click unsubscribe, the way gmail and yahoo now require it | [DELIVERABILITY.md §6.1](DELIVERABILITY.md#61-one-click-unsubscribe-rfc-8058) | 0 | Build |
| warming new IPs and domains on a schedule | [DELIVERABILITY.md §3](DELIVERABILITY.md#3-warming-de-ips-y-dominios) · [DELIVERABILITY.md §3.1](DELIVERABILITY.md#31-ip-nueva-calendario-día-a-día) · [DELIVERABILITY.md §3.2](DELIVERABILITY.md#32-dominio-nuevo-de-envío) | 0 | Build |
| watching blocklists around the clock, and pulling an IP from rotation the moment it's listed | [DELIVERABILITY.md §4](DELIVERABILITY.md#4-blocklists-vigilancia-247-y-retirada-automática) · [DELIVERABILITY.md §15.2](DELIVERABILITY.md#152-runbook-ip-listada) — feeds Spamhaus DQS comprados | 0 | Híbrido |
| retrying deferred mail for 24+ hours before calling it a bounce | [DELIVERABILITY.md §8.2](DELIVERABILITY.md#82-reintentos-de-deferrals) | 0 | Build |
| blocking disposable, invalid, and typo'd addresses before they ever reach the list | [DELIVERABILITY.md §10](DELIVERABILITY.md#10-validación-de-emails-1st-party-y-3rd-party) | 0 | Build |
| rate limiting every signup endpoint a bot can find | [DELIVERABILITY.md §11.1](DELIVERABILITY.md#111-detección-de-altas-bot-y-rate-limiting) · [GROWTH_AND_MONETIZATION.md §2.4](GROWTH_AND_MONETIZATION.md#24-pipeline-de-alta-común-a-formularios-popups-link-in-bio-y-lead-magnets) | 0 | Build |
| filtering bot clicks out of every report (something we pay an ungodly amount of money for) | [DELIVERABILITY.md §13](DELIVERABILITY.md#13-filtrado-de-bots-en-aperturas-y-clics--métricas-verificadas) · [BUILD_VS_BUY.md §11](BUILD_VS_BUY.md#11-click-verification--build) | 1 | Build |
| an acquisition source on every subscriber | [GROWTH_AND_MONETIZATION.md §1.1](GROWTH_AND_MONETIZATION.md#11-entidad-acquisition) · [ARCHITECTURE.md §5.2](ARCHITECTURE.md#52-audiencia) | 0 | Build |
| engagement history for every reader, across every post | [API_AND_AI.md §1.2 Suscriptores](API_AND_AI.md#suscriptores-campos-y-tags) · [ARCHITECTURE.md §7](ARCHITECTURE.md#7-clickhouse) | 1 | Build |
| multiple sender addresses for different emails | [DELIVERABILITY.md §5.7](DELIVERABILITY.md#57-múltiples-remitentes) | 0 | Build |
| custom domain configuration that is aligned with DKIM, SPF, DMARC | [DELIVERABILITY.md §5.1](DELIVERABILITY.md#51-requisitos-externos-que-cumplimos-por-defecto) · [DELIVERABILITY.md §5.3](DELIVERABILITY.md#53-asistente-de-dominio-personalizado) | 0 | Build |

## 2. Editor

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| a true WYSIWYG editor: what you write is what lands in the inbox, with no HTML required | [EDITOR.md §1](EDITOR.md#1-el-modelo-de-documento-ast) · [EDITOR.md §6.1](EDITOR.md#61-renderer-de-email) — Tiptap/ProseMirror (OSS) | 0 | Build |
| turning that editor into table-based, inline-styled email HTML that holds up in outlook | [EDITOR.md §6.1](EDITOR.md#61-renderer-de-email) | 0 | Build |
| real-time collaborative editing, so the whole team can work on the same issue at once | [EDITOR.md §2](EDITOR.md#2-colaboración-en-tiempo-real) — Yjs + Hocuspocus (OSS) | 1 | Build |
| dynamic content: different sections for different readers, all in a single send | [EDITOR.md §8](EDITOR.md#8-contenido-dinámico-y-envíos-por-cohortes) · [PLATFORM.md §3.4](PLATFORM.md#34-usos) | 1 | Build |
| separate email and web versions of every post, from one draft | [EDITOR.md §1.2](EDITOR.md#12-reglas-del-modelo) · [EDITOR.md §6](EDITOR.md#6-renderers-funciones-puras) | 1 | Build |
| free and premium versions of the same post, split by a paywall break | [EDITOR.md §1.2](EDITOR.md#12-reglas-del-modelo) · [GROWTH_AND_MONETIZATION.md §10.4](GROWTH_AND_MONETIZATION.md#104-paywall-y-muro-medido) | 1 | Build |
| merge tags that personalize every email, and a simulated subscriber to preview them before you send | [EDITOR.md §7](EDITOR.md#7-merge-tags-y-suscriptor-simulado) | 1 | Build |
| templates with saved colors, fonts, and spacing, plus a default style for every post | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| columns, tables, buttons, blockquotes, sections, file attachments, and a table of contents with anchor links | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) · [EDITOR.md §3.1](EDITOR.md#31-toc-y-notas-al-pie-email-vs-web) — botones, citas y divisores ya en F0 | 1 | Build |
| native embeds for X, youtube, tiktok, instagram, bluesky, stocktwits, and podcast episodes | [EDITOR.md §3.2](EDITOR.md#32-embeds-polls-y-html-personalizado) · [ROADMAP.md Lo que NO haríamos](ROADMAP.md#lo-que-no-haríamos) — YouTube/X/Bluesky/podcast en F1; TikTok, Instagram y Stocktwits según demanda (F2+) | 1 | Build |
| polls, referral blocks, recommendations, and ad slots, built right into the post | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) · [EDITOR.md §3.2](EDITOR.md#32-embeds-polls-y-html-personalizado) — ad slots de la red en F3; sponsor slots en F2 | 2 | Build |
| an AI writer, AI images, and a built-in AI agent one keyboard shortcut away | [EDITOR.md §12](EDITOR.md#12-ia-en-el-editor) · [API_AND_AI.md §4.1](API_AND_AI.md#41-superficies) — Claude y modelo de imagen comprados | 2 | Híbrido |
| images resized and optimized automatically, however they're uploaded | [EDITOR.md §5](EDITOR.md#5-pipeline-de-imágenes) · [BUILD_VS_BUY.md §12](BUILD_VS_BUY.md#12-media-storage--cdn--buy-r2--cloudflare-images) — Cloudflare Images + pipeline propio | 0 | Híbrido |
| a live email-size gauge that warns you before gmail clips your newsletter | [EDITOR.md §9](EDITOR.md#9-medidor-de-tamaño-y-preflight) | 0 | Build |
| custom HTML blocks, cleaned so a stray script tag can't break your post | [EDITOR.md §3.2](EDITOR.md#32-embeds-polls-y-html-personalizado) | 1 | Build |
| automatically hiding anything an inbox can't handle (video, iframes, audio) in the email version, while keeping it on the web | [EDITOR.md §6.1](EDITOR.md#61-renderer-de-email) | 1 | Build |
| links and embeds made clickable even in outlook, which ignores links wrapped around tables | [EDITOR.md §6.1](EDITOR.md#61-renderer-de-email) | 1 | Build |
| vertical alignment in columns, because a layout that looks off by 4px looks broken to readers | [EDITOR.md §6.1](EDITOR.md#61-renderer-de-email) | 1 | Build |
| converting your newsletter to audio versions for readers who prefer to listen | [EDITOR.md §6.4](EDITOR.md#64-renderer-de-audio-tts) · [BUILD_VS_BUY.md §E3](BUILD_VS_BUY.md#e3-speech-to-text-y-tts--híbrido) — TTS comprado | 2 | Híbrido |
| random cohort sends to randomly split your list to test different content and conversion | [EDITOR.md §8](EDITOR.md#8-contenido-dinámico-y-envíos-por-cohortes) | 1 | Build |
| slash commands: type "/" and insert any block without touching a menu | [EDITOR.md §4.1](EDITOR.md#41-slash-commands) | 0 | Build |
| markdown and keyboard shortcuts for people who never want to touch a mouse | [EDITOR.md §4.2](EDITOR.md#42-atajos-markdown-input-rules) · [EDITOR.md §4.3](EDITOR.md#43-mapa-de-teclado) | 0 | Build |
| pasting from google docs with the formatting intact | [EDITOR.md §4.4](EDITOR.md#44-pegado-desde-google-docs-y-word-notion) | 1 | Build |
| search and replace across the whole post | [EDITOR.md §4.5](EDITOR.md#45-buscar-y-reemplazar) | 1 | Build |
| comment threads right in the draft, so editors and writers stop living in google docs | [EDITOR.md §2.1](EDITOR.md#21-comentarios-anclados-a-rangos) | 1 | Build |
| footnotes and citations that work in the inbox and on the web | [EDITOR.md §3.1](EDITOR.md#31-toc-y-notas-al-pie-email-vs-web) | 1 | Build |
| code blocks, for the technical newsletters | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) | 0 | Build |
| an AI writer that rewrites, translates, and fixes spelling and grammar in place | [EDITOR.md §12](EDITOR.md#12-ia-en-el-editor) | 2 | Híbrido |
| autosave, so a closed tab never costs you a draft | [EDITOR.md §2.3](EDITOR.md#23-autosave-e-historial) | 0 | Build |
| subject line A/B testing, built into the send flow | [EDITOR.md §13](EDITOR.md#13-ab-test-de-asunto-en-el-flujo-de-envío) | 1 | Build |
| drag-and-drop images, from your computer, your media library, or a URL | [EDITOR.md §4.6](EDITOR.md#46-arrastrar-y-soltar-imágenes) · [EDITOR.md §5](EDITOR.md#5-pipeline-de-imágenes) | 0 | Build |
| rich-text image captions, plus image titles and alt text for accessibility | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) | 1 | Build |
| audio files that play inline | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) | 1 | Build |
| file attachments, so a PDF can ride along with the issue *(duplicado, ver arriba)* | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) — = «columns, tables, buttons, blockquotes, sections, file…» | 1 | Build |
| sections with their own backgrounds, borders, and spacing | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) | 1 | Build |
| blockquotes with custom borders, colors, and styles | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) | 1 | Build |
| content breaks and dividers that render cleanly in every inbox | [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) · [EDITOR.md §6.1](EDITOR.md#61-renderer-de-email) | 0 | Build |

## 3. API REST y Send API

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| a REST API for subscribers, posts, segments, automations, and more | [API_AND_AI.md §1.1](API_AND_AI.md#11-reglas-de-diseño-no-negociables) · [API_AND_AI.md §1.2](API_AND_AI.md#12-catálogo-de-recursos-y-endpoints) | 1 | Build |
| a send API to create and send newsletters programmatically | [API_AND_AI.md §1.2 Send API](API_AND_AI.md#send-api) | 1 | Build |
| creating, updating, and deleting subscribers in real time | [API_AND_AI.md §1.2 Suscriptores](API_AND_AI.md#suscriptores-campos-y-tags) | 1 | Build |
| reading and writing custom fields on any subscriber | [API_AND_AI.md §1.2 Suscriptores](API_AND_AI.md#suscriptores-campos-y-tags) | 1 | Build |
| tagging subscribers from your own app | [API_AND_AI.md §1.2 Suscriptores](API_AND_AI.md#suscriptores-campos-y-tags) | 1 | Build |
| enrolling subscribers into automations via API | [API_AND_AI.md §1.2 Automatizaciones](API_AND_AI.md#automatizaciones) · [PLATFORM.md §2.2](PLATFORM.md#22-triggers) | 1 | Build |
| pulling opens, clicks, and engagement for every post | [API_AND_AI.md §1.2 Analítica](API_AND_AI.md#analítica) | 1 | Build |
| fetching post HTML rendered for free vs. premium, email vs. web | [API_AND_AI.md §1.2 Posts](API_AND_AI.md#posts-plantillas-y-renderizado) · [EDITOR.md §6](EDITOR.md#6-renderers-funciones-puras) | 1 | Build |
| creating posts from a template, then appending or prepending content | [API_AND_AI.md §1.2 Posts](API_AND_AI.md#posts-plantillas-y-renderizado) · [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) — append/prepend ya en F1; `from_template` con las plantillas de F2 | 2 | Build |
| fetching segments and every subscriber in them | [API_AND_AI.md §1.2 Segmentos](API_AND_AI.md#segmentos) | 1 | Build |
| managing tiers and premium subscriptions | [API_AND_AI.md §1.2 Monetización](API_AND_AI.md#monetización-crecimiento-y-engagement) | 1 | Build |
| pulling referral program data and milestones | [API_AND_AI.md §1.2 Monetización](API_AND_AI.md#monetización-crecimiento-y-engagement) · [GROWTH_AND_MONETIZATION.md §6](GROWTH_AND_MONETIZATION.md#6-programa-de-referidos) | 2 | Build |
| reading poll and survey responses | [API_AND_AI.md §1.2 Monetización](API_AND_AI.md#monetización-crecimiento-y-engagement) | 2 | Build |
| pagination that holds up across millions of records | [API_AND_AI.md §1.1 Paginación keyset](API_AND_AI.md#paginación-keyset-por-qué-el-offset-no-sirve) | 1 | Build |
| rate limits that protect the platform without blocking real integrations | [API_AND_AI.md §1.3](API_AND_AI.md#13-rate-limits-bulk-y-jobs-asíncronos) | 1 | Build |
| API keys you can create and revoke anytime | [API_AND_AI.md §1.4](API_AND_AI.md#14-api-keys) | 1 | Build |

## 4. Servidor MCP e IA conversacional

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| an MCP server so claude, chatgpt, and other AI tools can work inside beehiiv | [API_AND_AI.md §3.1](API_AND_AI.md#31-arquitectura) · [API_AND_AI.md §3.3](API_AND_AI.md#33-seguridad) | 2 | Build |
| drafting and editing posts from an AI chat | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) | 2 | Build |
| asking for open rates, CTR, and revenue in plain english | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) · [API_AND_AI.md §4.3](API_AND_AI.md#43-lenguaje-natural--segmento-y--analítica) — semantic layer propia + Claude | 2 | Híbrido |
| comparing performance across dozens of posts in one request | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) | 2 | Build |
| looking up any subscriber's full history and engagement | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) | 2 | Build |
| building segments by describing them | [API_AND_AI.md §4.3](API_AND_AI.md#43-lenguaje-natural--segmento-y--analítica) · [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) | 2 | Híbrido |
| creating and editing automations | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) · [PLATFORM.md §2.4](PLATFORM.md#24-draft-vs-live-semántica-de-versiones) | 2 | Build |
| generating AI images straight into your media library | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) · [EDITOR.md §12](EDITOR.md#12-ia-en-el-editor) · [BUILD_VS_BUY.md §E2](BUILD_VS_BUY.md#e2-generación-de-imágenes--buy-detrás-de-un-adaptador) | 2 | Híbrido |
| managing website pages, redirects, and SEO | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) | 2 | Build |
| reading and replying to community posts and DMs | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) — llega con la comunidad (F3) | 3 | Build |
| reviewing ad offers and ad revenue reports | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) — llega con la ad network (F3) | 3 | Build |
| managing podcast shows and episodes | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) — llega con el podcast (F3) | 3 | Build |
| creating digital products, coupons, and promo codes | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) — llega con productos (F3); cupones de tiers en F2 | 3 | Build |
| running subscriber growth and earnings reports | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) | 2 | Build |
| setting up subject line A/B tests | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) · [EDITOR.md §13](EDITOR.md#13-ab-test-de-asunto-en-el-flujo-de-envío) | 2 | Build |
| deliverability by mailbox provider for any post | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) · [DELIVERABILITY.md §14.1](DELIVERABILITY.md#141-panel-por-proveedor-por-envío-y-por-publicación) | 2 | Build |
| searching docs without leaving the chat | [API_AND_AI.md §3.2](API_AND_AI.md#32-herramientas-curadas-cobertura-del-backlog) | 2 | Build |

## 5. Equipo, roles y acceso

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| inviting teammates by email | [API_AND_AI.md §5.3](API_AND_AI.md#53-invitaciones-cambio-de-workspace-y-búsqueda) | 0 | Build |
| admin, member, and contributor roles | [API_AND_AI.md §5.2](API_AND_AI.md#52-matriz-de-permisos) | 0 | Build |
| admins who control billing, exports, integrations, payments, and domains | [API_AND_AI.md §5.2](API_AND_AI.md#52-matriz-de-permisos) | 0 | Build |
| members with full access minus admin permissions | [API_AND_AI.md §5.2](API_AND_AI.md#52-matriz-de-permisos) | 0 | Build |
| contributors limited to drafting posts and automations | [API_AND_AI.md §5.2](API_AND_AI.md#52-matriz-de-permisos) | 0 | Build |
| roles at the workspace or publication level | [API_AND_AI.md §5.1](API_AND_AI.md#51-modelo) — workspace en F0; override por publicación en F1 | 1 | Build |
| multiple publications under one workspace | [API_AND_AI.md §5.1](API_AND_AI.md#51-modelo) · [ARCHITECTURE.md §4](ARCHITECTURE.md#4-tenancy) | 1 | Build |
| workspace grouping and search for people on multiple teams | [API_AND_AI.md §5.3](API_AND_AI.md#53-invitaciones-cambio-de-workspace-y-búsqueda) | 1 | Build |
| multiple authors per post, with bylines | [API_AND_AI.md §5.4](API_AND_AI.md#54-autores) | 1 | Build |
| guest authors for one-off contributors | [API_AND_AI.md §5.4](API_AND_AI.md#54-autores) | 1 | Build |
| author profiles with bios, avatars, and social links | [API_AND_AI.md §5.4](API_AND_AI.md#54-autores) | 1 | Build |
| community roles mapped to workspace roles (admin, manager, moderator) | [API_AND_AI.md §5.5](API_AND_AI.md#55-comunidad) · [PLATFORM.md §4.2](PLATFORM.md#42-roles-y-moderación) — Owner/Admin → admin, Member → manager, Contributor → moderator | 3 | Build |
| real-time collaboration and comment threads on every draft *(duplicado, ver arriba)* | [EDITOR.md §2](EDITOR.md#2-colaboración-en-tiempo-real) · [EDITOR.md §2.1](EDITOR.md#21-comentarios-anclados-a-rangos) — = «real-time collaborative editing, so the whole…» | 1 | Build |
| removing access the moment someone leaves | [API_AND_AI.md §5.6](API_AND_AI.md#56-desprovisionamiento-instantáneo) | 1 | Build |
| publication transfers between owners, with written consent | [API_AND_AI.md §5.7](API_AND_AI.md#57-transferencia-de-publicación-con-consentimiento-escrito) | 1 | Build |
| secure, single-use magic links to log in from desktop | [API_AND_AI.md §5.8](API_AND_AI.md#58-login-del-equipo) · [BUILD_VS_BUY.md §5](BUILD_VS_BUY.md#5-auth--build-con-piezas-oss) | 0 | Build |

## 6. Website builder

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| a no-code website builder on your own custom domain | [PLATFORM.md §1.1](PLATFORM.md#11-arquitectura-un-único-renderer-en-el-edge) · [PLATFORM.md §1.3](PLATFORM.md#13-modelo-de-página-bloques-no-html) — dominio custom vía Cloudflare for SaaS (ya en F1 para la web básica) | 2 | Híbrido |
| an AI website builder that works from plain-english prompts or screenshots | [PLATFORM.md §1.7](PLATFORM.md#17-ai-website-builder-prompt-o-screenshot--bloques) | 3 | Híbrido |
| AI custom elements for live widgets | [PLATFORM.md §1.8](PLATFORM.md#18-ai-custom-elements-widgets-vivos) — no figura en ROADMAP; se agrupa con el AI website builder | 3 | Híbrido |
| drag-and-drop editing, plus HTML access for full control | [PLATFORM.md §1.3](PLATFORM.md#13-modelo-de-página-bloques-no-html) | 2 | Build |
| site-wide theme tokens for fonts, colors, borders, and shadows | [PLATFORM.md §1.3](PLATFORM.md#13-modelo-de-página-bloques-no-html) | 2 | Build |
| global navbar, footer, and signup and login modals | [PLATFORM.md §1.3](PLATFORM.md#13-modelo-de-página-bloques-no-html) | 2 | Build |
| saving sections, blocks, and pages as reusable templates | [PLATFORM.md §1.3](PLATFORM.md#13-modelo-de-página-bloques-no-html) | 2 | Build |
| version history with one-click restore | [PLATFORM.md §1.4](PLATFORM.md#14-versionado-borradores-y-restore) · [ARCHITECTURE.md §10](ARCHITECTURE.md#10-branching-draftlive-patrón-transversal) | 2 | Build |
| custom pages with their own SEO settings and paywalls | [PLATFORM.md §1.5](PLATFORM.md#15-páginas-seo-y-descubribilidad) | 2 | Build |
| redirects, so old links never break | [PLATFORM.md §1.5](PLATFORM.md#15-páginas-seo-y-descubribilidad) | 1 | Build |
| custom robots.txt | [PLATFORM.md §1.5](PLATFORM.md#15-páginas-seo-y-descubribilidad) · [PLATFORM.md §7.4](PLATFORM.md#74-crawlers-de-ia-analítica-y-control) | 1 | Build |
| auto-generated meta titles and descriptions for every post | [PLATFORM.md §1.5](PLATFORM.md#15-páginas-seo-y-descubribilidad) — generación con Claude | 1 | Híbrido |
| google news schema | [PLATFORM.md §1.5](PLATFORM.md#15-páginas-seo-y-descubribilidad) · [EDITOR.md §6.2](EDITOR.md#62-renderer-web) | 1 | Build |
| pages up to 80% faster on largest contentful paint | [PLATFORM.md §1.2](PLATFORM.md#12-rendimiento-el-lcp-como-requisito-no-como-métrica) — LCP p75 < 1,5 s en F1 y < 1,2 s en F2 | 1 | Build |
| image carousels and grids | [PLATFORM.md §1.6](PLATFORM.md#16-bloques-dinámicos) | 2 | Build |
| youtube blocks that update when you post new videos | [PLATFORM.md §1.6](PLATFORM.md#16-bloques-dinámicos) | 2 | Build |
| an automatic page for every podcast episode | [PLATFORM.md §5.2](PLATFORM.md#52-página-por-episodio-y-librería) | 3 | Build |
| pop-ups and gated content to turn visitors into subscribers | [PLATFORM.md §1.6](PLATFORM.md#16-bloques-dinámicos) · [GROWTH_AND_MONETIZATION.md §2.6](GROWTH_AND_MONETIZATION.md#26-popups-y-gating-en-el-sitio-tirada) — gating a suscriptores ya en F1 | 2 | Build |

## 7. Automatizaciones

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| a visual automation builder, no code required | [PLATFORM.md §2.1](PLATFORM.md#21-modelo) — sobre Temporal Cloud (comprado) | 1 | Build |
| triggers based on signup source, behavior, purchases, and engagement | [PLATFORM.md §2.2](PLATFORM.md#22-triggers) | 1 | Build |
| welcome sequences that start the second someone subscribes | [PLATFORM.md §2.2](PLATFORM.md#22-triggers) | 1 | Build |
| delays and wait steps | [PLATFORM.md §2.1](PLATFORM.md#21-modelo) | 1 | Build |
| branching logic based on subscriber attributes | [PLATFORM.md §2.1](PLATFORM.md#21-modelo) | 1 | Build |
| reusable condition sets across automations | [PLATFORM.md §2.3](PLATFORM.md#23-condiciones-reutilizables) | 1 | Build |
| email steps built in the same editor as your newsletter | [PLATFORM.md §2.1](PLATFORM.md#21-modelo) | 1 | Build |
| webhook steps that call your own systems, with automatic retries | [PLATFORM.md §2.5](PLATFORM.md#25-webhook-steps) · [API_AND_AI.md §2.5](API_AND_AI.md#25-pasos-webhook-dentro-de-automatizaciones) | 1 | Build |
| enrolling subscribers via API *(duplicado, ver arriba)* | [API_AND_AI.md §1.2 Automatizaciones](API_AND_AI.md#automatizaciones) · [PLATFORM.md §2.2](PLATFORM.md#22-triggers) — = «enrolling subscribers into automations via API» | 1 | Build |
| per-subscriber journey tracking | [PLATFORM.md §2.6](PLATFORM.md#26-observabilidad) | 1 | Build |
| opens and clicks for every email in every flow | [PLATFORM.md §2.6](PLATFORM.md#26-observabilidad) | 1 | Build |
| editing a draft version while the live automation keeps running | [PLATFORM.md §2.4](PLATFORM.md#24-draft-vs-live-semántica-de-versiones) · [ARCHITECTURE.md §10](ARCHITECTURE.md#10-branching-draftlive-patrón-transversal) | 1 | Build |
| comparing draft vs. live before you publish changes | [PLATFORM.md §2.4](PLATFORM.md#24-draft-vs-live-semántica-de-versiones) | 1 | Build |
| reordering steps in bulk | [PLATFORM.md §2.6](PLATFORM.md#26-observabilidad) | 1 | Build |
| segment conditions based on whether an automation started | [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) | 1 | Build |
| product delivery and follow-ups triggered by purchases | [PLATFORM.md §2.2](PLATFORM.md#22-triggers) · [GROWTH_AND_MONETIZATION.md §11.2](GROWTH_AND_MONETIZATION.md#112-compra-y-entrega-automática) | 3 | Build |

## 8. Productos digitales

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| selling files, links, guides, templates, and ebooks | [GROWTH_AND_MONETIZATION.md §11.1](GROWTH_AND_MONETIZATION.md#111-tipos) — Stripe Checkout + entrega propia | 3 | Híbrido |
| memberships and time-based products | [GROWTH_AND_MONETIZATION.md §11.1](GROWTH_AND_MONETIZATION.md#111-tipos) | 3 | Híbrido |
| 1:1 coaching sessions and appointments | [GROWTH_AND_MONETIZATION.md §11.3](GROWTH_AND_MONETIZATION.md#113-coaching-y-citas) · [ROADMAP.md Lo que NO haríamos](ROADMAP.md#lo-que-no-haríamos) — reserva y calendario vía Cal.com; producto, cobro, vínculo con el suscriptor y recordatorios en Tirada | 3 | Integración |
| 0% platform fees on every sale | [GROWTH_AND_MONETIZATION.md §13.1](GROWTH_AND_MONETIZATION.md#131-lo-que-cobramos-y-lo-que-no) · [GROWTH_AND_MONETIZATION.md §11.2](GROWTH_AND_MONETIZATION.md#112-compra-y-entrega-automática) — Stripe Connect con application_fee = 0 | 3 | Buy |
| a storefront on your beehiiv website | [GROWTH_AND_MONETIZATION.md §11.4](GROWTH_AND_MONETIZATION.md#114-reseñas-pedidos-e-informes) | 3 | Build |
| products sold inside emails and automations | [GROWTH_AND_MONETIZATION.md §11.2](GROWTH_AND_MONETIZATION.md#112-compra-y-entrega-automática) · [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) — bloque `product` | 3 | Build |
| free products that double as lead magnets | [GROWTH_AND_MONETIZATION.md §11.2](GROWTH_AND_MONETIZATION.md#112-compra-y-entrega-automática) | 3 | Build |
| product variants | [GROWTH_AND_MONETIZATION.md §11.1](GROWTH_AND_MONETIZATION.md#111-tipos) | 3 | Build |
| discount codes and promotion codes | [GROWTH_AND_MONETIZATION.md §11.2](GROWTH_AND_MONETIZATION.md#112-compra-y-entrega-automática) · [GROWTH_AND_MONETIZATION.md §10.2](GROWTH_AND_MONETIZATION.md#102-modelo) — cupones y promotion codes de Stripe | 3 | Buy |
| product reviews, with moderation | [GROWTH_AND_MONETIZATION.md §11.4](GROWTH_AND_MONETIZATION.md#114-reseñas-pedidos-e-informes) | 3 | Build |
| product tags for organizing your catalog | [GROWTH_AND_MONETIZATION.md §11.1](GROWTH_AND_MONETIZATION.md#111-tipos) | 3 | Build |
| orders dashboard with buyer details | [GROWTH_AND_MONETIZATION.md §11.4](GROWTH_AND_MONETIZATION.md#114-reseñas-pedidos-e-informes) | 3 | Build |
| sales totals per product | [GROWTH_AND_MONETIZATION.md §11.4](GROWTH_AND_MONETIZATION.md#114-reseñas-pedidos-e-informes) | 3 | Build |
| duplicating a product in one click | [GROWTH_AND_MONETIZATION.md §11.1](GROWTH_AND_MONETIZATION.md#111-tipos) | 3 | Build |
| automatic delivery the moment someone buys | [GROWTH_AND_MONETIZATION.md §11.2](GROWTH_AND_MONETIZATION.md#112-compra-y-entrega-automática) — workflow Temporal `DeliverOrder` | 3 | Build |
| payouts through stripe | [GROWTH_AND_MONETIZATION.md §10.1](GROWTH_AND_MONETIZATION.md#101-stripe-connect) · [BUILD_VS_BUY.md §4](BUILD_VS_BUY.md#4-payments--buy) | 3 | Buy |

## 9. Webinars

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| live webinars with up to 10,000 attendees | [GROWTH_AND_MONETIZATION.md §12.1](GROWTH_AND_MONETIZATION.md#121-arquitectura) · [BUILD_VS_BUY.md §E4](BUILD_VS_BUY.md#e4-vídeo-y-webinars--buy-livekit-cloud--mux) — LiveKit + Mux | 3 | Buy |
| ticket sales in 10 currencies | [GROWTH_AND_MONETIZATION.md §12.2](GROWTH_AND_MONETIZATION.md#122-entradas-recordatorios-y-calendario) | 3 | Híbrido |
| native streaming with video, screen sharing, and chat | [GROWTH_AND_MONETIZATION.md §12.1](GROWTH_AND_MONETIZATION.md#121-arquitectura) | 3 | Buy |
| no zoom required | [GROWTH_AND_MONETIZATION.md §12.1](GROWTH_AND_MONETIZATION.md#121-arquitectura) | 3 | Buy |
| up to 5 automated reminder emails | [GROWTH_AND_MONETIZATION.md §12.2](GROWTH_AND_MONETIZATION.md#122-entradas-recordatorios-y-calendario) | 3 | Build |
| calendar invites sent automatically | [GROWTH_AND_MONETIZATION.md §12.2](GROWTH_AND_MONETIZATION.md#122-entradas-recordatorios-y-calendario) | 3 | Build |
| a recording of every session | [GROWTH_AND_MONETIZATION.md §12.3](GROWTH_AND_MONETIZATION.md#123-grabación-replay-y-crecimiento) — grabación en Mux | 3 | Buy |
| selling the replay as its own product | [GROWTH_AND_MONETIZATION.md §12.3](GROWTH_AND_MONETIZATION.md#123-grabación-replay-y-crecimiento) | 3 | Build |
| 0% platform fees on tickets | [GROWTH_AND_MONETIZATION.md §12.2](GROWTH_AND_MONETIZATION.md#122-entradas-recordatorios-y-calendario) · [GROWTH_AND_MONETIZATION.md §13.1](GROWTH_AND_MONETIZATION.md#131-lo-que-cobramos-y-lo-que-no) | 3 | Buy |
| free webinars that grow your list | [GROWTH_AND_MONETIZATION.md §12.3](GROWTH_AND_MONETIZATION.md#123-grabación-replay-y-crecimiento) | 3 | Build |
| discount codes on tickets | [GROWTH_AND_MONETIZATION.md §12.2](GROWTH_AND_MONETIZATION.md#122-entradas-recordatorios-y-calendario) | 3 | Buy |
| 1:1 coaching bookings *(duplicado, ver arriba)* | [GROWTH_AND_MONETIZATION.md §11.3](GROWTH_AND_MONETIZATION.md#113-coaching-y-citas) — = «1:1 coaching sessions and appointments» | 3 | Integración |
| buyers linked to their subscriber profile | [GROWTH_AND_MONETIZATION.md §12.3](GROWTH_AND_MONETIZATION.md#123-grabación-replay-y-crecimiento) | 3 | Build |
| promoting events in your newsletter and on your site | [GROWTH_AND_MONETIZATION.md §12.3](GROWTH_AND_MONETIZATION.md#123-grabación-replay-y-crecimiento) · [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) — bloque `event` | 3 | Build |
| orders and revenue reporting for every event | [GROWTH_AND_MONETIZATION.md §12.3](GROWTH_AND_MONETIZATION.md#123-grabación-replay-y-crecimiento) | 3 | Build |

## 10. Comunidad

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| a community built into your newsletter: channels, posts, and comments | [PLATFORM.md §4.1](PLATFORM.md#41-decisión-comunidad-nativa-simple-asíncrona) | 3 | Build |
| channels that are free or gated to paid tiers | [PLATFORM.md §4.1](PLATFORM.md#41-decisión-comunidad-nativa-simple-asíncrona) · [GROWTH_AND_MONETIZATION.md §10.6](GROWTH_AND_MONETIZATION.md#106-perks-de-pago) | 3 | Build |
| syncing newsletter posts into the community | [PLATFORM.md §4.1](PLATFORM.md#41-decisión-comunidad-nativa-simple-asíncrona) | 3 | Build |
| direct messages between you and members | [PLATFORM.md §4.1](PLATFORM.md#41-decisión-comunidad-nativa-simple-asíncrona) — solo creador ↔ miembro | 3 | Build |
| threaded comments | [PLATFORM.md §4.1](PLATFORM.md#41-decisión-comunidad-nativa-simple-asíncrona) | 3 | Build |
| pinned posts | [PLATFORM.md §4.1](PLATFORM.md#41-decisión-comunidad-nativa-simple-asíncrona) | 3 | Build |
| a moderation queue for reported posts and comments | [PLATFORM.md §4.2](PLATFORM.md#42-roles-y-moderación) — clasificador con Claude | 3 | Híbrido |
| banning and unbanning members | [PLATFORM.md §4.2](PLATFORM.md#42-roles-y-moderación) | 3 | Build |
| admin, manager, and moderator roles *(duplicado, ver arriba)* | [PLATFORM.md §4.2](PLATFORM.md#42-roles-y-moderación) · [API_AND_AI.md §5.5](API_AND_AI.md#55-comunidad) — = «community roles mapped to workspace roles…» | 3 | Build |
| inviting subscribers, segments, or specific emails | [PLATFORM.md §4.3](PLATFORM.md#43-crecimiento-y-notificaciones) | 3 | Build |
| surfacing your most engaged subscribers to invite first | [PLATFORM.md §4.3](PLATFORM.md#43-crecimiento-y-notificaciones) | 3 | Build |
| community metrics: new members, posts, and activity | [PLATFORM.md §4.3](PLATFORM.md#43-crecimiento-y-notificaciones) | 3 | Build |
| notification emails with your own from name | [PLATFORM.md §4.3](PLATFORM.md#43-crecimiento-y-notificaciones) | 3 | Build |
| channel ordering and a default channel | [PLATFORM.md §4.1](PLATFORM.md#41-decisión-comunidad-nativa-simple-asíncrona) | 3 | Build |
| luma calendar integration for events | [PLATFORM.md §4.4](PLATFORM.md#44-integraciones) | 3 | Integración |
| discord integration that syncs roles with subscription tiers | [PLATFORM.md §4.4](PLATFORM.md#44-integraciones) · [GROWTH_AND_MONETIZATION.md §10.6](GROWTH_AND_MONETIZATION.md#106-perks-de-pago) | 3 | Integración |

## 11. Podcast

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| native podcast hosting with zero platform fees | [PLATFORM.md §5.1](PLATFORM.md#51-hosting-y-feed) · [GROWTH_AND_MONETIZATION.md §13.1](GROWTH_AND_MONETIZATION.md#131-lo-que-cobramos-y-lo-que-no) — incluido en todos los planes, 0 % en feeds privados, episodios ilimitados, sin topes de descargas | 3 | Build |
| distribution to apple podcasts, spotify, and youtube | [PLATFORM.md §5.1](PLATFORM.md#51-hosting-y-feed) | 3 | Integración |
| an automatic webpage for every episode *(duplicado, ver arriba)* | [PLATFORM.md §5.2](PLATFORM.md#52-página-por-episodio-y-librería) — = «an automatic page for every podcast…» | 3 | Build |
| automatic transcripts | [PLATFORM.md §5.2](PLATFORM.md#52-página-por-episodio-y-librería) · [BUILD_VS_BUY.md §E3](BUILD_VS_BUY.md#e3-speech-to-text-y-tts--híbrido) — STT comprado | 3 | Híbrido |
| IAB-standard analytics by country, app, and device | [PLATFORM.md §5.3](PLATFORM.md#53-analítica-iab-22) · [ARCHITECTURE.md §7](ARCHITECTURE.md#7-clickhouse) | 3 | Build |
| bot filtering on downloads | [PLATFORM.md §5.3](PLATFORM.md#53-analítica-iab-22) | 3 | Build |
| downloads and unique listeners per episode and per show | [PLATFORM.md §5.3](PLATFORM.md#53-analítica-iab-22) | 3 | Build |
| private feeds for paying subscribers | [PLATFORM.md §5.4](PLATFORM.md#54-feeds-privados-y-paid-bundle) | 3 | Build |
| bundling your podcast with your paid subscription | [PLATFORM.md §5.4](PLATFORM.md#54-feeds-privados-y-paid-bundle) · [GROWTH_AND_MONETIZATION.md §10.6](GROWTH_AND_MONETIZATION.md#106-perks-de-pago) | 3 | Build |
| importing from other hosts with episode GUIDs preserved | [PLATFORM.md §5.5](PLATFORM.md#55-migración-desde-otro-host) | 3 | Build |
| RSS redirects so listeners follow you over | [PLATFORM.md §5.5](PLATFORM.md#55-migración-desde-otro-host) | 3 | Build |
| scheduled episodes | [PLATFORM.md §5.1](PLATFORM.md#51-hosting-y-feed) | 3 | Build |
| apple podcasts categories and metadata | [PLATFORM.md §5.1](PLATFORM.md#51-hosting-y-feed) | 3 | Build |
| podcast players embedded in your posts | [PLATFORM.md §5.2](PLATFORM.md#52-página-por-episodio-y-librería) · [EDITOR.md §3.2](EDITOR.md#32-embeds-polls-y-html-personalizado) — embeds de episodios externos ya en F1 | 3 | Build |
| a full episode library on your site | [PLATFORM.md §5.2](PLATFORM.md#52-página-por-episodio-y-librería) | 3 | Build |
| webhooks for episode and private-feed events | [PLATFORM.md §5.4](PLATFORM.md#54-feeds-privados-y-paid-bundle) · [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) | 3 | Build |

## 12. Segmentos

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| segments built on behavior, attributes, and engagement | [PLATFORM.md §3.1](PLATFORM.md#31-principios) · [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) | 1 | Build |
| dynamic segments that update automatically | [PLATFORM.md §3.3](PLATFORM.md#33-evaluación-incremental-desde-el-event-stream) · [ARCHITECTURE.md §9](ARCHITECTURE.md#9-motor-de-segmentos-con-roaring-bitmaps) | 1 | Build |
| static segments that stay fixed | [PLATFORM.md §3.1](PLATFORM.md#31-principios) | 1 | Build |
| filtering by acquisition source, including magic links | [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) · [GROWTH_AND_MONETIZATION.md §1.1](GROWTH_AND_MONETIZATION.md#11-entidad-acquisition) | 1 | Build |
| filtering by custom fields and tags | [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) | 1 | Build |
| filtering by subscription tier and paid trial status | [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) | 1 | Build |
| filtering by whether an automation started *(duplicado, ver arriba)* | [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) — = «segment conditions based on whether an…» | 1 | Build |
| reusable condition sets *(duplicado, ver arriba)* | [PLATFORM.md §2.3](PLATFORM.md#23-condiciones-reutilizables) · [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) — = «reusable condition sets across automations» | 1 | Build |
| recalculating a segment on demand | [PLATFORM.md §3.3](PLATFORM.md#33-evaluación-incremental-desde-el-event-stream) · [ARCHITECTURE.md §9](ARCHITECTURE.md#9-motor-de-segmentos-con-roaring-bitmaps) | 1 | Build |
| sending to a segment, or excluding one | [PLATFORM.md §3.4](PLATFORM.md#34-usos) | 1 | Build |
| segments that power dynamic content inside a single post | [PLATFORM.md §3.4](PLATFORM.md#34-usos) · [EDITOR.md §8](EDITOR.md#8-contenido-dinámico-y-envíos-por-cohortes) | 1 | Build |
| segments as automation conditions | [PLATFORM.md §3.4](PLATFORM.md#34-usos) | 1 | Build |
| adding a whole segment to a newsletter list | [PLATFORM.md §3.4](PLATFORM.md#34-usos) | 1 | Build |
| multiple newsletter lists in one publication | [PLATFORM.md §3.4](PLATFORM.md#34-usos) | 1 | Build |
| exporting any segment | [PLATFORM.md §3.4](PLATFORM.md#34-usos) | 1 | Build |

## 13. Webhooks

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| webhooks for new, confirmed, and deleted subscribers | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) | 1 | Build |
| upgrade, downgrade, pause, and resume events | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) | 1 | Build |
| tier created, deleted, paused, and resumed events | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) | 1 | Build |
| newsletter list subscribe and unsubscribe events | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) | 1 | Build |
| post sent, scheduled, and updated events | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) | 1 | Build |
| survey response events | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) · [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) — `survey.response.created` | 2 | Build |
| podcast episode published, updated, archived, and deleted events | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) | 3 | Build |
| private podcast feed access events | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) · [PLATFORM.md §5.4](PLATFORM.md#54-feeds-privados-y-paid-bundle) — `podcast.private_feed.access_granted\|access_revoked\|accessed` | 3 | Build |
| choosing exactly which events each endpoint receives | [API_AND_AI.md §2.2](API_AND_AI.md#22-endpoints-selección-de-eventos-y-payload) | 1 | Build |
| a signing secret on every endpoint | [API_AND_AI.md §2.3](API_AND_AI.md#23-firma-y-rotación-de-secretos) | 1 | Build |
| automatic retries on failed deliveries | [API_AND_AI.md §2.4](API_AND_AI.md#24-reintentos-log-y-operación) | 1 | Build |
| a log of every delivery attempt | [API_AND_AI.md §2.4](API_AND_AI.md#24-reintentos-log-y-operación) | 1 | Build |
| manually retrying any failed message | [API_AND_AI.md §2.4](API_AND_AI.md#24-reintentos-log-y-operación) | 1 | Build |
| disabling an endpoint without deleting it | [API_AND_AI.md §2.4](API_AND_AI.md#24-reintentos-log-y-operación) | 1 | Build |
| versioned payloads | [API_AND_AI.md §2.2](API_AND_AI.md#22-endpoints-selección-de-eventos-y-payload) · [API_AND_AI.md §1.1 Versionado](API_AND_AI.md#versionado-por-fecha-estilo-stripe) | 1 | Build |
| webhook steps inside automations *(duplicado, ver arriba)* | [API_AND_AI.md §2.5](API_AND_AI.md#25-pasos-webhook-dentro-de-automatizaciones) · [PLATFORM.md §2.5](PLATFORM.md#25-webhook-steps) — = «webhook steps that call your own…» | 1 | Build |

## 14. Encuestas y polls

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| survey forms with multiple question types | [PLATFORM.md §6.1](PLATFORM.md#61-modelo) | 2 | Build |
| polls that readers answer with one click, right in the inbox | [PLATFORM.md §6.2](PLATFORM.md#62-polls-de-un-clic-en-el-email) · [EDITOR.md §3.2](EDITOR.md#32-embeds-polls-y-html-personalizado) | 2 | Build |
| every answer tied to a real subscriber | [PLATFORM.md §6.1](PLATFORM.md#61-modelo) | 2 | Build |
| live poll results | [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) | 2 | Build |
| per-question response breakdowns | [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) | 2 | Build |
| aggregate results across every survey | [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) | 2 | Build |
| individual responses you can browse one by one | [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) | 2 | Build |
| webhooks the moment a survey is submitted | [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) · [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) | 2 | Build |
| survey and poll data available via API | [API_AND_AI.md §1.2 Monetización](API_AND_AI.md#monetización-crecimiento-y-engagement) | 2 | Build |
| polls on the web and in email | [PLATFORM.md §6.1](PLATFORM.md#61-modelo) · [PLATFORM.md §6.2](PLATFORM.md#62-polls-de-un-clic-en-el-email) | 2 | Build |
| signup flows that send new subscribers through a survey | [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) · [GROWTH_AND_MONETIZATION.md §2.5](GROWTH_AND_MONETIZATION.md#25-éxito-listas-y-signup-flows) | 2 | Build |
| surveys that tell you what to write next | [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) · [API_AND_AI.md §4.1](API_AND_AI.md#41-superficies) — resumen de respuestas con Claude | 2 | Híbrido |
| polls for picking topics, products, and pricing | [PLATFORM.md §6.1](PLATFORM.md#61-modelo) | 2 | Build |
| response data you can turn into segments | [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos) | 2 | Build |
| no third-party form tool required | [PLATFORM.md §6.1](PLATFORM.md#61-modelo) | 2 | Build |

## 15. Plantillas

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| a library of professionally designed post templates | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| custom colors, fonts, and spacing on every template *(duplicado, ver arriba)* | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) — = «templates with saved colors, fonts, and…» | 2 | Build |
| a default style applied to every new post *(duplicado, ver arriba)* | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) — = «templates with saved colors, fonts, and…» | 2 | Build |
| content outlines baked into templates | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| separate email and web styling | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| theme design tokens per template | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| duplicating templates in one click | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) · [API_AND_AI.md §1.2 Posts](API_AND_AI.md#posts-plantillas-y-renderizado) | 2 | Build |
| a custom email footer applied to every post | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| templates with sponsor slots, referral blocks, and recommendations built in | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| creating posts from templates via API *(duplicado, ver arriba)* | [API_AND_AI.md §1.2 Posts](API_AND_AI.md#posts-plantillas-y-renderizado) — = «creating posts from a template, then…» | 2 | Build |
| template changes picked up instantly by API-created posts | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| website templates | [PLATFORM.md §1.3](PLATFORM.md#13-modelo-de-página-bloques-no-html) | 2 | Build |
| saved sections, blocks, and pages for your site *(duplicado, ver arriba)* | [PLATFORM.md §1.3](PLATFORM.md#13-modelo-de-página-bloques-no-html) — = «saving sections, blocks, and pages as…» | 2 | Build |
| welcome email templates | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |
| templates your whole team shares | [EDITOR.md §11](EDITOR.md#11-plantillas-y-design-tokens) | 2 | Build |

## 16. Ad network y patrocinios

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| the largest native ad network for newsletters | [GROWTH_AND_MONETIZATION.md §8.1](GROWTH_AND_MONETIZATION.md#81-modelo-del-marketplace) · [GROWTH_AND_MONETIZATION.md §8.5](GROWTH_AND_MONETIZATION.md#85-arranque-en-frío-llegar-a-500-marcas) — marketplace Build; la demanda es una operación de ventas | 3 | Operación |
| brands like netflix, hubspot, notion, and nike (and 525+ others) | [GROWTH_AND_MONETIZATION.md §8.5](GROWTH_AND_MONETIZATION.md#85-arranque-en-frío-llegar-a-500-marcas) | 3 | Operación |
| ads available to claim for your upcoming posts | [GROWTH_AND_MONETIZATION.md §8.2](GROWTH_AND_MONETIZATION.md#82-flujo-del-creador-reclamar-insertar-cobrar) | 3 | Build |
| dropping an ad into a post with one click | [GROWTH_AND_MONETIZATION.md §8.2](GROWTH_AND_MONETIZATION.md#82-flujo-del-creador-reclamar-insertar-cobrar) · [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) | 3 | Build |
| earnings and payouts reported for every placement | [GROWTH_AND_MONETIZATION.md §8.4](GROWTH_AND_MONETIZATION.md#84-wallet-ganancias-y-payouts) | 3 | Build |
| ad revenue reports post by post | [GROWTH_AND_MONETIZATION.md §8.4](GROWTH_AND_MONETIZATION.md#84-wallet-ganancias-y-payouts) · [API_AND_AI.md §1.2 Monetización](API_AND_AI.md#monetización-crecimiento-y-engagement) | 3 | Build |
| a history of every opportunity you accepted or declined | [GROWTH_AND_MONETIZATION.md §8.2](GROWTH_AND_MONETIZATION.md#82-flujo-del-creador-reclamar-insertar-cobrar) | 3 | Build |
| bot-filtered clicks advertisers can trust | [GROWTH_AND_MONETIZATION.md §8.2](GROWTH_AND_MONETIZATION.md#82-flujo-del-creador-reclamar-insertar-cobrar) · [DELIVERABILITY.md §13](DELIVERABILITY.md#13-filtrado-de-bots-en-aperturas-y-clics--métricas-verificadas) | 3 | Build |
| custom link parameters for advertiser attribution | [GROWTH_AND_MONETIZATION.md §8.2](GROWTH_AND_MONETIZATION.md#82-flujo-del-creador-reclamar-insertar-cobrar) | 3 | Build |
| brand safety review on every campaign | [GROWTH_AND_MONETIZATION.md §8.3](GROWTH_AND_MONETIZATION.md#83-brand-safety-en-los-dos-sentidos) — Claude + Google Web Risk + revisión humana | 3 | Híbrido |
| payouts to your beehiiv wallet | [GROWTH_AND_MONETIZATION.md §8.4](GROWTH_AND_MONETIZATION.md#84-wallet-ganancias-y-payouts) — ledger propio + payouts por Stripe Connect | 3 | Híbrido |
| direct sponsorships: selling your own placements | [GROWTH_AND_MONETIZATION.md §9](GROWTH_AND_MONETIZATION.md#9-patrocinios-directos) | 2 | Build |
| sponsorship products with your own formats and pricing | [GROWTH_AND_MONETIZATION.md §9](GROWTH_AND_MONETIZATION.md#9-patrocinios-directos) | 2 | Build |
| scheduled sponsor placements with advertiser details | [GROWTH_AND_MONETIZATION.md §9](GROWTH_AND_MONETIZATION.md#9-patrocinios-directos) | 2 | Build |

## 17. Suscripciones de pago

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| 0% platform fees on paid subscriptions | [GROWTH_AND_MONETIZATION.md §10.1](GROWTH_AND_MONETIZATION.md#101-stripe-connect) · [GROWTH_AND_MONETIZATION.md §13.1](GROWTH_AND_MONETIZATION.md#131-lo-que-cobramos-y-lo-que-no) — Stripe Connect Express | 1 | Buy |
| multiple paid tiers | [GROWTH_AND_MONETIZATION.md §10.2](GROWTH_AND_MONETIZATION.md#102-modelo) | 1 | Híbrido |
| monthly and annual plans | [GROWTH_AND_MONETIZATION.md §10.2](GROWTH_AND_MONETIZATION.md#102-modelo) — Stripe Billing | 1 | Buy |
| free trials | [GROWTH_AND_MONETIZATION.md §10.2](GROWTH_AND_MONETIZATION.md#102-modelo) | 1 | Buy |
| paid trials, like $1 for 30 days | [GROWTH_AND_MONETIZATION.md §10.2](GROWTH_AND_MONETIZATION.md#102-modelo) — Subscription Schedules de Stripe | 1 | Buy |
| metered paywalls, new york times-style | [GROWTH_AND_MONETIZATION.md §10.4](GROWTH_AND_MONETIZATION.md#104-paywall-y-muro-medido) | 3 | Build |
| a paywall break inside any post *(duplicado, ver arriba)* | [GROWTH_AND_MONETIZATION.md §10.4](GROWTH_AND_MONETIZATION.md#104-paywall-y-muro-medido) · [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) — = «free and premium versions of the…» | 1 | Build |
| discount offers | [GROWTH_AND_MONETIZATION.md §10.2](GROWTH_AND_MONETIZATION.md#102-modelo) | 1 | Híbrido |
| gift subscriptions | [GROWTH_AND_MONETIZATION.md §10.5](GROWTH_AND_MONETIZATION.md#105-regalos-grupos-y-acuerdos-a-medida) | 3 | Híbrido |
| group subscriptions: one buyer, many seats | [GROWTH_AND_MONETIZATION.md §10.5](GROWTH_AND_MONETIZATION.md#105-regalos-grupos-y-acuerdos-a-medida) | 3 | Híbrido |
| custom group deals for teams and companies | [GROWTH_AND_MONETIZATION.md §10.5](GROWTH_AND_MONETIZATION.md#105-regalos-grupos-y-acuerdos-a-medida) | 3 | Híbrido |
| pausing and resuming subscriptions | [GROWTH_AND_MONETIZATION.md §10.3](GROWTH_AND_MONETIZATION.md#103-ciclo-de-vida) | 1 | Buy |
| private podcast feeds and gated community channels as paid perks | [GROWTH_AND_MONETIZATION.md §10.6](GROWTH_AND_MONETIZATION.md#106-perks-de-pago) | 3 | Build |
| payouts through stripe connect | [GROWTH_AND_MONETIZATION.md §10.1](GROWTH_AND_MONETIZATION.md#101-stripe-connect) · [BUILD_VS_BUY.md §4](BUILD_VS_BUY.md#4-payments--buy) — mismo mecanismo que «payouts through stripe» (productos), pero aquí para suscripciones desde F1 | 1 | Buy |

## 18. Red de recomendaciones

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| recommendation network with 60K+ active newsletters | [GROWTH_AND_MONETIZATION.md §7.1](GROWTH_AND_MONETIZATION.md#71-dos-modalidades) · [ROADMAP.md Top 10 riesgos](ROADMAP.md#top-10-riesgos) — efecto de red: se acumula, no se construye | 2 | Operación |
| getting recommended by thousands of other newsletters | [GROWTH_AND_MONETIZATION.md §7.1](GROWTH_AND_MONETIZATION.md#71-dos-modalidades) | 2 | Build |
| free, reciprocal recommendations | [GROWTH_AND_MONETIZATION.md §7.1](GROWTH_AND_MONETIZATION.md#71-dos-modalidades) | 2 | Build |
| paid recommendations: pay to grow, or get paid to recommend | [GROWTH_AND_MONETIZATION.md §7.1](GROWTH_AND_MONETIZATION.md#71-dos-modalidades) | 3 | Build |
| discovering newsletters to partner with | [GROWTH_AND_MONETIZATION.md §7.2](GROWTH_AND_MONETIZATION.md#72-descubrimiento-y-partners-sugeridos-por-ia) | 2 | Build |
| AI-suggested recommendation partners | [GROWTH_AND_MONETIZATION.md §7.2](GROWTH_AND_MONETIZATION.md#72-descubrimiento-y-partners-sugeridos-por-ia) — Claude + embeddings comprados, pgvector | 2 | Híbrido |
| applications for paid recommendations, with accept and reject | [GROWTH_AND_MONETIZATION.md §7.3](GROWTH_AND_MONETIZATION.md#73-ciclo-de-vida-de-una-partnership) | 3 | Build |
| engagement and spend insights for every partner | [GROWTH_AND_MONETIZATION.md §7.3](GROWTH_AND_MONETIZATION.md#73-ciclo-de-vida-de-una-partnership) | 3 | Build |
| pausing, resuming, or ending any partnership | [GROWTH_AND_MONETIZATION.md §7.3](GROWTH_AND_MONETIZATION.md#73-ciclo-de-vida-de-una-partnership) | 3 | Build |
| fraud detection on paid recommendations | [GROWTH_AND_MONETIZATION.md §7.4](GROWTH_AND_MONETIZATION.md#74-fraude-retención-y-clawback) | 3 | Build |
| clawing back payouts for fake subscribers | [GROWTH_AND_MONETIZATION.md §7.4](GROWTH_AND_MONETIZATION.md#74-fraude-retención-y-clawback) | 3 | Build |
| recommendations inside your newsletter, not just at signup | [GROWTH_AND_MONETIZATION.md §7.1](GROWTH_AND_MONETIZATION.md#71-dos-modalidades) · [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) | 2 | Build |
| attribution for every subscriber a partner sends you | [GROWTH_AND_MONETIZATION.md §1.1](GROWTH_AND_MONETIZATION.md#11-entidad-acquisition) · [GROWTH_AND_MONETIZATION.md §7.1](GROWTH_AND_MONETIZATION.md#71-dos-modalidades) | 2 | Build |

## 19. Magic links de suscripción

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| one-click subscribes powered by magic links | [GROWTH_AND_MONETIZATION.md §3](GROWTH_AND_MONETIZATION.md#3-magic-links-de-suscripción) | 2 | Build |
| one-click subscribe links, no form needed | [GROWTH_AND_MONETIZATION.md §3.1](GROWTH_AND_MONETIZATION.md#31-dos-variantes) | 2 | Build |
| UTM parameters carried through on every link | [GROWTH_AND_MONETIZATION.md §3.2](GROWTH_AND_MONETIZATION.md#32-flujo) | 2 | Build |
| rate limiting on every request | [GROWTH_AND_MONETIZATION.md §3.2](GROWTH_AND_MONETIZATION.md#32-flujo) | 2 | Build |
| bot detection and honeypots | [GROWTH_AND_MONETIZATION.md §3.2](GROWTH_AND_MONETIZATION.md#32-flujo) · [GROWTH_AND_MONETIZATION.md §2.4](GROWTH_AND_MONETIZATION.md#24-pipeline-de-alta-común-a-formularios-popups-link-in-bio-y-lead-magnets) — Turnstile + honeypot/scoring propio | 2 | Híbrido |
| a confirmation step only when a click looks suspicious | [GROWTH_AND_MONETIZATION.md §3.2](GROWTH_AND_MONETIZATION.md#32-flujo) | 2 | Build |
| double opt-in respected | [GROWTH_AND_MONETIZATION.md §3.2](GROWTH_AND_MONETIZATION.md#32-flujo) · [GROWTH_AND_MONETIZATION.md §2.4](GROWTH_AND_MONETIZATION.md#24-pipeline-de-alta-común-a-formularios-popups-link-in-bio-y-lead-magnets) — DOI en formularios ya en F0 | 2 | Build |
| redirecting new subscribers straight to your site | [GROWTH_AND_MONETIZATION.md §3.2](GROWTH_AND_MONETIZATION.md#32-flujo) | 2 | Build |
| magic links as a filterable acquisition source *(duplicado, ver arriba)* | [GROWTH_AND_MONETIZATION.md §1.1](GROWTH_AND_MONETIZATION.md#11-entidad-acquisition) · [PLATFORM.md §3.2](PLATFORM.md#32-dsl-de-condiciones) — = «filtering by acquisition source, including magic…» | 2 | Build |
| links you can drop into other newsletters, socials, and ads | [GROWTH_AND_MONETIZATION.md §3.1](GROWTH_AND_MONETIZATION.md#31-dos-variantes) | 2 | Build |

## 20. Login de lectores

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| login magic links so paid subscribers can read premium posts | [GROWTH_AND_MONETIZATION.md §4.2](GROWTH_AND_MONETIZATION.md#42-token-de-login) · [GROWTH_AND_MONETIZATION.md §10.4](GROWTH_AND_MONETIZATION.md#104-paywall-y-muro-medido) | 1 | Build |
| single-use tokens that expire in minutes | [GROWTH_AND_MONETIZATION.md §4.2](GROWTH_AND_MONETIZATION.md#42-token-de-login) · [BUILD_VS_BUY.md §5](BUILD_VS_BUY.md#5-auth--build-con-piezas-oss) | 0 | Build |
| rate limits on login requests | [GROWTH_AND_MONETIZATION.md §4.2](GROWTH_AND_MONETIZATION.md#42-token-de-login) | 0 | Build |
| protection against timing attacks | [GROWTH_AND_MONETIZATION.md §4.2](GROWTH_AND_MONETIZATION.md#42-token-de-login) | 0 | Build |
| logging in on desktop from a link sent to mobile | [GROWTH_AND_MONETIZATION.md §4.3](GROWTH_AND_MONETIZATION.md#43-login-en-desktop-desde-un-enlace-abierto-en-el-móvil) · [API_AND_AI.md §5.8](API_AND_AI.md#58-login-del-equipo) | 1 | Build |
| faster logins across every beehiiv publication | [GROWTH_AND_MONETIZATION.md §4.1](GROWTH_AND_MONETIZATION.md#41-reader-global) — identidad global de Reader | 2 | Build |

## 21. Formularios de suscripción

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| embeddable subscribe forms for any website | [GROWTH_AND_MONETIZATION.md §2.3](GROWTH_AND_MONETIZATION.md#23-funciona-en-cualquier-sitio) | 0 | Build |
| full-width, fixed-width, and slim embeds | [GROWTH_AND_MONETIZATION.md §2.2](GROWTH_AND_MONETIZATION.md#22-tres-formatos-de-embed) | 0 | Build |
| an attribution script to track where signups come from | [GROWTH_AND_MONETIZATION.md §1.2](GROWTH_AND_MONETIZATION.md#12-script-de-atribución) — fase inferida (fuente de adquisición en F0) | 0 | Build |
| custom colors, fonts, and styling | [GROWTH_AND_MONETIZATION.md §2.1](GROWTH_AND_MONETIZATION.md#21-modelo) | 0 | Build |
| theme design tokens per form | [GROWTH_AND_MONETIZATION.md §2.1](GROWTH_AND_MONETIZATION.md#21-modelo) — fase inferida: tokens heredados del sitio (F2) | 2 | Build |
| a draft and publish workflow for form changes | [GROWTH_AND_MONETIZATION.md §2.1](GROWTH_AND_MONETIZATION.md#21-modelo) · [ARCHITECTURE.md §10](ARCHITECTURE.md#10-branching-draftlive-patrón-transversal) — fase inferida | 1 | Build |
| comparing draft vs. live before publishing | [GROWTH_AND_MONETIZATION.md §2.1](GROWTH_AND_MONETIZATION.md#21-modelo) — fase inferida | 1 | Build |
| multiple forms per publication | [GROWTH_AND_MONETIZATION.md §2.1](GROWTH_AND_MONETIZATION.md#21-modelo) | 0 | Build |
| custom success behavior: a message or a redirect | [GROWTH_AND_MONETIZATION.md §2.5](GROWTH_AND_MONETIZATION.md#25-éxito-listas-y-signup-flows) | 0 | Build |
| pop-ups on your beehiiv site *(duplicado, ver arriba)* | [GROWTH_AND_MONETIZATION.md §2.6](GROWTH_AND_MONETIZATION.md#26-popups-y-gating-en-el-sitio-tirada) · [PLATFORM.md §1.6](PLATFORM.md#16-bloques-dinámicos) — = «pop-ups and gated content to turn…» | 2 | Build |
| gating posts to subscribers only | [GROWTH_AND_MONETIZATION.md §2.6](GROWTH_AND_MONETIZATION.md#26-popups-y-gating-en-el-sitio-tirada) | 1 | Build |
| readers picking which newsletter lists to join | [GROWTH_AND_MONETIZATION.md §2.5](GROWTH_AND_MONETIZATION.md#25-éxito-listas-y-signup-flows) · [PLATFORM.md §3.4](PLATFORM.md#34-usos) | 1 | Build |
| signup flows that run right after subscribing | [GROWTH_AND_MONETIZATION.md §2.5](GROWTH_AND_MONETIZATION.md#25-éxito-listas-y-signup-flows) | 2 | Build |
| bot protection on every submission | [GROWTH_AND_MONETIZATION.md §2.4](GROWTH_AND_MONETIZATION.md#24-pipeline-de-alta-común-a-formularios-popups-link-in-bio-y-lead-magnets) · [DELIVERABILITY.md §11.1](DELIVERABILITY.md#111-detección-de-altas-bot-y-rate-limiting) | 0 | Híbrido |
| forms that work on wordpress, webflow, and anywhere else | [GROWTH_AND_MONETIZATION.md §2.3](GROWTH_AND_MONETIZATION.md#23-funciona-en-cualquier-sitio) — plugin WordPress / app de Webflow en F1–F2 | 0 | Build |

## 22. Link-in-bio

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| a customizable link-in-bio page | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |
| hosted on your own beehiiv site and domain | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) · [PLATFORM.md §1.1](PLATFORM.md#11-arquitectura-un-único-renderer-en-el-edge) | 2 | Build |
| a subscribe form built in | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |
| your brand colors, fonts, and buttons | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) · [PLATFORM.md §1.3](PLATFORM.md#13-modelo-de-página-bloques-no-html) | 2 | Build |
| social links for every platform | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |
| links to your latest posts | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |
| links to your products and paid tiers | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |
| a linktree integration that captures newsletter signups | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) · [PLATFORM.md §8.2](PLATFORM.md#82-catálogo-de-lanzamiento-por-orden-de-valor) | 2 | Integración |
| every visitor a potential subscriber | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |
| traffic from instagram, tiktok, and X turned into owned email subscribers | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |
| visits tracked in your website analytics | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) · [PLATFORM.md §7.1](PLATFORM.md#71-website-analytics-sin-terceros) | 2 | Build |
| signups tagged with their acquisition source | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) · [GROWTH_AND_MONETIZATION.md §1.1](GROWTH_AND_MONETIZATION.md#11-entidad-acquisition) | 2 | Build |
| mobile-first design | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) · [PLATFORM.md Restricción de dispositivo](PLATFORM.md#restricción-de-dispositivo-el-dashboard-es-solo-desktop) | 2 | Build |
| no third-party link tool required | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |
| updated in seconds, from the same dashboard as everything else | [GROWTH_AND_MONETIZATION.md §5](GROWTH_AND_MONETIZATION.md#5-link-in-bio) | 2 | Build |

## 23. Analítica

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| real-time website analytics, no third-party tools | [PLATFORM.md §7.1](PLATFORM.md#71-website-analytics-sin-terceros) · [PLATFORM.md §7.5](PLATFORM.md#75-dashboard-unificado) | 1 | Build |
| traffic by channel | [PLATFORM.md §7.2](PLATFORM.md#72-dimensiones-canales-y-filtros) | 1 | Build |
| filters for location, device, OS, and referral source | [PLATFORM.md §7.2](PLATFORM.md#72-dimensiones-canales-y-filtros) | 1 | Build |
| website and newsletter analytics in one place | [PLATFORM.md §7.5](PLATFORM.md#75-dashboard-unificado) | 1 | Build |
| breakdowns by page, referrer, and more | [PLATFORM.md §7.2](PLATFORM.md#72-dimensiones-canales-y-filtros) | 1 | Build |
| custom conditions to slice any report | [PLATFORM.md §7.2](PLATFORM.md#72-dimensiones-canales-y-filtros) | 1 | Build |
| AI crawler and bot analytics: what was served vs. blocked | [PLATFORM.md §7.4](PLATFORM.md#74-crawlers-de-ia-analítica-y-control) · [ARCHITECTURE.md §7](ARCHITECTURE.md#7-clickhouse) — fase inferida (junto a robots.txt y analítica web) | 1 | Build |
| control over which crawlers can index your site | [PLATFORM.md §7.4](PLATFORM.md#74-crawlers-de-ia-analítica-y-control) | 1 | Build |
| UTM tracking on every link | [PLATFORM.md §7.2](PLATFORM.md#72-dimensiones-canales-y-filtros) | 1 | Build |
| custom link parameters at the publication level | [PLATFORM.md §7.2](PLATFORM.md#72-dimensiones-canales-y-filtros) · [GROWTH_AND_MONETIZATION.md §1.1](GROWTH_AND_MONETIZATION.md#11-entidad-acquisition) | 1 | Build |
| an acquisition source on every subscriber *(duplicado, ver arriba)* | [GROWTH_AND_MONETIZATION.md §1.1](GROWTH_AND_MONETIZATION.md#11-entidad-acquisition) — = «an acquisition source on every subscriber» | 0 | Build |
| google analytics integration | [PLATFORM.md §7.2](PLATFORM.md#72-dimensiones-canales-y-filtros) · [PLATFORM.md §8.2](PLATFORM.md#82-catálogo-de-lanzamiento-por-orden-de-valor) | 2 | Integración |
| podcast analytics alongside your site | [PLATFORM.md §7.5](PLATFORM.md#75-dashboard-unificado) | 3 | Build |
| trends over time | [PLATFORM.md §7.5](PLATFORM.md#75-dashboard-unificado) | 1 | Build |
| website traffic connected to the subscribers it produced | [PLATFORM.md §7.3](PLATFORM.md#73-atribución-tráfico--suscriptores) | 1 | Build |

## 24. Integraciones y soporte

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| native integrations with linktree, hubspot, manychat, meta, and dozens of other apps | [PLATFORM.md §8.1](PLATFORM.md#81-framework-no-conectores-a-mano) · [PLATFORM.md §8.2](PLATFORM.md#82-catálogo-de-lanzamiento-por-orden-de-valor) — Zapier/Make para la cola larga | 2 | Integración |
| human support team with a dozen experts ready to assist with whatever you need | [PLATFORM.md §9](PLATFORM.md#9-soporte) · [BUILD_VS_BUY.md §E8](BUILD_VS_BUY.md#e8-soporte--híbrido) — help desk comprado | 0 | Operación |

## 25. Las 13 categorías de proveedores

| Feature (original) | Dónde se diseña | Fase | Build/Buy/Integración |
|---|---|:-:|---|
| email sending (sendgrid, amazon SES, postmark) | [BUILD_VS_BUY.md §1](BUILD_VS_BUY.md#1-email-sending--oss--build) · [DELIVERABILITY.md §1](DELIVERABILITY.md#1-la-flota-kumomta) — KumoMTA (OSS) + capa de control propia; relay de respaldo para transaccional | 0 | Build |
| web hosting (vercel, AWS, render) | [BUILD_VS_BUY.md §2](BUILD_VS_BUY.md#2-web-hosting--buy-edge--buy-core) — Cloudflare Workers/for SaaS + AWS | 0 | Buy |
| database + queue (supabase, neon, RDS) | [BUILD_VS_BUY.md §3](BUILD_VS_BUY.md#3-database--queue--híbrido) · [ARCHITECTURE.md §6](ARCHITECTURE.md#6-pipeline-de-eventos) — Postgres RDS, Redpanda, ClickHouse, Valkey | 0 | Híbrido |
| payments (stripe, memberful) | [BUILD_VS_BUY.md §4](BUILD_VS_BUY.md#4-payments--buy) · [GROWTH_AND_MONETIZATION.md §10.1](GROWTH_AND_MONETIZATION.md#101-stripe-connect) — Stripe Connect | 1 | Buy |
| auth (clerk, auth0, supabase auth) | [BUILD_VS_BUY.md §5](BUILD_VS_BUY.md#5-auth--build-con-piezas-oss) · [API_AND_AI.md §5.8](API_AND_AI.md#58-login-del-equipo) — piezas OSS (SimpleWebAuthn, Ory Polis) | 0 | Build |
| monitoring + alerting (sentry, datadog, pagerduty) | [BUILD_VS_BUY.md §6](BUILD_VS_BUY.md#6-monitoring--alerting--buy-sobre-opentelemetry--build-para-logs-de-envío) · [ARCHITECTURE.md §13](ARCHITECTURE.md#13-observabilidad-y-slos) — OTel + Sentry + Grafana Cloud + incident.io; logs MTA en ClickHouse | 0 | Buy |
| workflow engine (inngest, temporal, upstash qstash) | [BUILD_VS_BUY.md §7](BUILD_VS_BUY.md#7-workflow-engine--buy-temporal-cloud) — Temporal Cloud | 0 | Buy |
| bot protection (cloudflare) | [BUILD_VS_BUY.md §8](BUILD_VS_BUY.md#8-bot-protection--híbrido-cloudflare-delante--scoring-propio) | 0 | Híbrido |
| email validation (zerobounce, kickbox) | [BUILD_VS_BUY.md §9](BUILD_VS_BUY.md#9-email-validation--build--kickbox-para-importaciones-grandes-al-principio) · [DELIVERABILITY.md §10](DELIVERABILITY.md#10-validación-de-emails-1st-party-y-3rd-party) — + Kickbox para importaciones (F1–F2) | 0 | Build |
| email rendering (litmus, email on acid) | [BUILD_VS_BUY.md §10](BUILD_VS_BUY.md#10-email-rendering--build--email-on-acid-api-en-ci) · [EDITOR.md §10](EDITOR.md#10-qa-de-renderizado) — + Email on Acid API en CI | 0 | Build |
| click verification (omnivery) | [BUILD_VS_BUY.md §11](BUILD_VS_BUY.md#11-click-verification--build) · [DELIVERABILITY.md §13](DELIVERABILITY.md#13-filtrado-de-bots-en-aperturas-y-clics--métricas-verificadas) | 1 | Build |
| media storage + CDN (S3, R2, vercel blob) | [BUILD_VS_BUY.md §12](BUILD_VS_BUY.md#12-media-storage--cdn--buy-r2--cloudflare-images) — R2 + Cloudflare Images | 0 | Buy |
| product analytics (posthog, mixpanel) | [BUILD_VS_BUY.md §13](BUILD_VS_BUY.md#13-product-analytics--buy-posthog-cloud-eu) — PostHog Cloud (EU) | 0 | Buy |

---

## Huecos e inconsistencias resueltos

**Huecos** (líneas que tenían cobertura parcial):

- **H-1 · products sold inside emails and automations**: bloque `product` añadido al catálogo de [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) (email: tarjeta con imagen, precio y botón bulletproof al checkout alojado; web: checkout inline en vivo; audio: omitido; texto: nombre + precio + enlace). [GROWTH_AND_MONETIZATION.md §11.2](GROWTH_AND_MONETIZATION.md#112-compra-y-entrega-automática) lo referencia.
- **H-2 · promoting events in your newsletter and on your site**: bloque `event` añadido a [EDITOR.md §3](EDITOR.md#3-catálogo-de-bloques) (email: fecha y hora estáticas en la zona del lector, plazas congeladas al enviar, botón "Reservar"; web: cuenta atrás y plazas en vivo; enlaza al checkout del webinar). [GROWTH_AND_MONETIZATION.md §12.3](GROWTH_AND_MONETIZATION.md#123-grabación-replay-y-crecimiento) lo referencia.
- **H-3 · native podcast hosting with zero platform fees**: fila de podcast en [GROWTH_AND_MONETIZATION.md §13.1](GROWTH_AND_MONETIZATION.md#131-lo-que-cobramos-y-lo-que-no): incluido en todos los planes, 0 % en feeds privados, episodios ilimitados, uso razonable de ancho de banda (egress de R2 gratis, sin topes de descargas).

**Inconsistencias** entre documentos:

- **I-1 · Coaching 1:1**: v1 integra Cal.com (UI de reserva y sync de calendario); Tirada es dueña del producto, el cobro (Stripe Connect), el vínculo comprador → suscriptor y los recordatorios; agenda nativa solo si el uso lo justifica. Alineados [GROWTH_AND_MONETIZATION.md §11.3](GROWTH_AND_MONETIZATION.md#113-coaching-y-citas), [ROADMAP.md Fase 3](ROADMAP.md#fase-3-meses-1524--monetización-amplia) y [ROADMAP.md Lo que NO haríamos](ROADMAP.md#lo-que-no-haríamos) (punto 8).
- **I-2 · Rol de comunidad del Contributor**: canónico Contributor → moderator (Owner/Admin → admin, Member → manager); [API_AND_AI.md §5.5](API_AND_AI.md#55-comunidad) y [PLATFORM.md §4.2](PLATFORM.md#42-roles-y-moderación) ya coincidían.
- **I-3 · Evento de encuesta**: `survey.response.created` (y `poll.response.created`), que sigue la convención `recurso.subrecurso.acción` del catálogo (`podcast.episode.published`, `community.member.joined`). Alineados [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos) y [PLATFORM.md §6.3](PLATFORM.md#63-resultados-y-datos).
- **I-4 · Feeds privados**: eventos canónicos del catálogo de [API_AND_AI.md §2.1](API_AND_AI.md#21-catálogo-de-eventos): `podcast.private_feed.access_granted|access_revoked|accessed` (una rotación emite `access_revoked` + `access_granted` con `reason: "rotated"`). Umbral único de compartición: > 3 /24 de IP distintas y > 2 user-agents de app distintos en 24 h → se marca; rotación del token al confirmar. Alineados [PLATFORM.md §5.4](PLATFORM.md#54-feeds-privados-y-paid-bundle) y [GROWTH_AND_MONETIZATION.md §10.6](GROWTH_AND_MONETIZATION.md#106-perks-de-pago).
- **I-5 · Roles de Discord**: sincronización en tiempo real por eventos + reconciliador diario en [PLATFORM.md §4.4](PLATFORM.md#44-integraciones) y [GROWTH_AND_MONETIZATION.md §10.6](GROWTH_AND_MONETIZATION.md#106-perks-de-pago).
- **I-6 · Reintentos del paso webhook en automatizaciones**: máximo 24 h y, al agotarse, `continue` o `exit`; [PLATFORM.md §2.5](PLATFORM.md#25-webhook-steps) y [API_AND_AI.md §2.5](API_AND_AI.md#25-pasos-webhook-dentro-de-automatizaciones) ya coincidían.
