# Tirada — diseño de producto para una alternativa a beehiiv

> *Tirada* (n.): el número de ejemplares que imprime un periódico. Aquí, la plataforma que hace toda la tirada: escribir, enviar, cobrar, crecer.

Este directorio responde al reto del founder de beehiiv: *"esta es la lista de cosas que tu alternativa hecha en un fin de semana tiene que incluir"*. La respuesta corta es que tiene razón: **esto no se hace en un fin de semana**. La respuesta larga son estos documentos: cómo lo construiríamos de verdad, qué compramos, qué construimos, en qué orden y, sobre todo, qué decisiones tomaríamos distinto.

## Índice

| Documento | Qué cubre |
|---|---|
| [README.md](README.md) | Tesis, principios y las decisiones de fondo (este archivo) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, servicios, modelo de datos, bus de eventos, multi-tenancy, escalado |
| [DELIVERABILITY.md](DELIVERABILITY.md) | MTA propio, IPs, warming, bounces, supresiones, feedback loops, bots |
| [EDITOR.md](EDITOR.md) | Modelo de documento único, colaboración, renderers email/web/audio, plantillas |
| [GROWTH_AND_MONETIZATION.md](GROWTH_AND_MONETIZATION.md) | Formularios, magic links, recomendaciones, ad network, suscripciones de pago, productos digitales, webinars |
| [PLATFORM.md](PLATFORM.md) | Website builder, automatizaciones, segmentos, comunidad, podcast, encuestas, analítica |
| [API_AND_AI.md](API_AND_AI.md) | REST API, Send API, webhooks, servidor MCP, agente de IA, auth y roles |
| [BUILD_VS_BUY.md](BUILD_VS_BUY.md) | La factura de proveedores del founder, línea a línea: qué compramos y qué no |
| [ROADMAP.md](ROADMAP.md) | Fases, equipo, costes y lo que **no** haríamos |
| [COVERAGE.md](COVERAGE.md) | Matriz: cada línea del backlog del founder → módulo → fase |

---

## La tesis

beehiiv no es un editor de newsletters. Es **una empresa de reputación de envío** con un CMS, una pasarela de pagos y una red publicitaria encima. Todo lo demás es replicable con esfuerzo; la reputación de las IPs y dominios, la confianza de Gmail y Yahoo, y los efectos de red (ad network, recomendaciones) no.

Por eso Tirada se diseña de abajo hacia arriba:

1. **Primero la entregabilidad.** Es la única feature que, si falla, hace que todas las demás no importen. Un newsletter en spam no vende anuncios, ni suscripciones, ni productos.
2. **Después el documento.** Un único modelo de contenido del que salen email, web, audio, API y lo que la IA lee/escribe.
3. **Después el grafo de eventos.** Cada apertura, clic, compra, visita y descarga es un evento en un único log. Segmentos, automatizaciones, webhooks, analítica y detección de fraude son *consumidores* de ese log, no sistemas separados.
4. **Por último, las superficies.** Website, comunidad, podcast, webinars, tienda. Son muchas, pero cada una es una vista fina sobre los tres cimientos anteriores.

## Principios (opinionados)

1. **Un documento, muchas salidas.** No existe "la versión email" y "la versión web" como objetos distintos. Existe un AST con condiciones de visibilidad (`email`, `web`, `free`, `premium`, `segment:X`, `cohort:B`) y renderers puros.
2. **Todo es un evento.** Patrón outbox en Postgres → Redpanda → consumidores. Si algo pasa y no hay evento, no pasó.
3. **API-first de verdad.** El dashboard usa la misma API pública que los clientes. El servidor MCP y el SDK se generan del mismo OpenAPI. Si el dashboard puede hacerlo, la API puede.
4. **Los clics importan, las aperturas no tanto.** Desde Apple Mail Privacy Protection, la tasa de apertura es una métrica inflada. Reportamos *aperturas verificadas* (excluyendo MPP y escáneres) aparte de las brutas, y la métrica norte del producto es el **clic humano verificado**.
5. **La reputación es compartida, así que se protege por defecto.** Supresión automática de inactivos (sunset policy) activada por defecto, kill-switch automático si la tasa de quejas supera 0,1 %, y publicaciones nuevas en un pool "en periodo de prueba" hasta que demuestran calidad de lista. Al cliente le duele un poco; a todos los demás les salva.
6. **0 % de comisión, siempre.** El negocio es la suscripción SaaS por tamaño de lista + revenue share de la ad network. Nunca un % de las ventas del creador. Stripe Connect con el creador como merchant.
7. **Construir el núcleo, comprar los commodities.** Construimos lo que es moat (MTA y reputación, validación de emails, filtrado de bots, renderer, segmentación, ad network). Compramos lo que es commodity o infraestructura física (pagos, CDN, streaming de vídeo, LLMs, observabilidad).
8. **Pocas piezas, pocos lenguajes.** TypeScript para producto, Go para los caminos calientes (tracking, ingesta), KumoMTA (Rust + Lua) para el envío. Postgres, ClickHouse, Redpanda, Valkey, Temporal. Nada más sin una razón escrita.
9. **Seguro por defecto para lectores.** Magic links de un solo uso con expiración en minutos, comparaciones en tiempo constante, rate limiting en cada endpoint público, HTML de usuario sanitizado siempre.
10. **La IA es un usuario más, no una feature aparte.** El agente interno y los agentes externos (Claude, ChatGPT vía MCP) operan con los mismos permisos, la misma API y el mismo audit log que un humano con ese rol.

## Decisiones de fondo (resumen)

| Área | Decisión | Por qué |
|---|---|---|
| Envío | **MTA propio sobre KumoMTA**, IPs dedicadas propias (objetivo: ASN propio) | SES/SendGrid no te dejan controlar warming, colas por proveedor ni reputación por pool. Es el moat. |
| Datos transaccionales | **Postgres** (multi-tenant con `workspace_id` en cada tabla + RLS), particionado por publicación grande | Aburrido y correcto. |
| Eventos / analítica | **ClickHouse** | Miles de millones de filas de opens/clicks/visitas/descargas con agregaciones en ms. |
| Bus | **Redpanda** (API Kafka) con outbox desde Postgres | Reproducible, rebobinable, múltiples consumidores. |
| Workflows durables | **Temporal** | Automatizaciones con esperas de semanas, reintentos de webhooks, recordatorios de webinars, entrega de productos. |
| Caché / rate limiting | **Valkey** | Token buckets, sesiones, contadores. |
| Segmentos | **Roaring bitmaps** materializados por segmento | Pertenencia O(1), intersecciones/exclusiones instantáneas al enviar. |
| Editor | **ProseMirror (Tiptap) + Yjs** con servidor Hocuspocus | El estándar de facto para colaboración en tiempo real. |
| Email HTML | **Renderer propio AST → tablas inline** (sin MJML) | Control total de Outlook, contenido dinámico y tamaño anti-clipping. |
| Websites | **Un único renderer multi-tenant en el edge** (Cloudflare Workers + Cloudflare for SaaS para dominios custom) | SSL automático por dominio, LCP bajo, cero servidores por cliente. |
| Pagos | **Stripe Connect (Express)** | No negociable. Nadie debe construir esto. |
| Auth | **Propia** (magic links, passkeys, SSO SAML para enterprise) | Lectores a escala de cientos de millones: Clerk/Auth0 a ese volumen es inviable y nos acopla. |
| Bots | **Cloudflare (Turnstile + WAF) delante + scoring propio** | La capa de red se compra; el modelo de fraude se construye con nuestros datos. |
| Vídeo en vivo | **LiveKit** (WebRTC) + **Mux** (grabación, VOD, replays) | Construir un SFU para 10.000 asistentes no es nuestro negocio. |
| IA | **Claude** vía API para escritura, agente y MCP; modelo de imagen de terceros | Mejor en agentes y uso de herramientas. |
| Media | **Cloudflare R2 + Images** | Sin egress, redimensionado al vuelo. |

## Lo que haríamos distinto a beehiiv

- **Una identidad de lector global ("Reader")** con suscripciones por publicación: login de un clic en cualquier newsletter de la red, recomendaciones de un clic, y fraude detectable a nivel de red.
- **Preflight obligatorio antes de enviar**: tamaño (clipping de Gmail a 102 KB), enlaces rotos, alt text faltante, merge tags sin fallback, spam score, contraste. No bloquea, pero hay que mirarlo.
- **Branches de borrador para todo** (posts, automatizaciones, formularios, website): el modelo "draft vs. live con diff" que beehiiv tiene en algunos sitios, aquí es un patrón transversal de la plataforma.
- **Reputación visible para el creador**: un panel que muestra, por proveedor (Gmail, Yahoo, Outlook, Apple), la tasa de quejas, rebotes y colocación estimada, con recomendaciones accionables. La entregabilidad deja de ser una caja negra.
- **Exportación total en un clic**: suscriptores, posts (Markdown + HTML), métricas y clientes de Stripe. Si el producto es bueno, no hace falta encerrar a nadie.
