# Build vs. Buy — la factura de proveedores, línea a línea

> El founder cierra su lista con 13 categorías de software "que tendrás que pagar y coser". Tiene razón en que existen. No la tiene en que la respuesta correcta sea siempre la misma (comprar el SaaS de la lista). Este documento decide, categoría por categoría, **qué compramos, qué construimos y qué autoalojamos**, cuánto cuesta a escala real y cómo nos iríamos si el proveedor nos falla.

Regla general (principio 7 del [README](README.md)): **construimos lo que es moat, compramos lo que es commodity o física**. Una regla secundaria que aplica en todo el documento: *nada que esté en el camino crítico del envío depende de un SaaS que no podamos sustituir en una semana*.

## Supuestos de escala

Todas las cifras de coste son **estimaciones de orden de magnitud** (precios de lista o negociados típicos a 2026, USD/mes), no presupuestos. Sirven para comparar alternativas, no para un plan financiero.

| Supuesto | Valor | Nota |
|---|---|---|
| Emails enviados | **10.000M/mes** | ~3.900/s de media; pico de 3M/min (50.000/s) como dice el founder |
| Tamaño medio de email | ~75 KB | → ~750 TB/mes de salida SMTP |
| Lectores únicos (identidad *Reader* global) | **50M** | ~120M suscripciones (un lector sigue ~2,4 publicaciones) |
| Publicaciones activas | 300.000 | 60.000 con pagos activos vía Stripe Connect |
| Pageviews web | 3.000M/mes | sites multi-tenant en el edge |
| Eventos en ClickHouse | ~30.000M filas/mes | envíos, entregas, aperturas, clics, visitas, descargas |
| Altas nuevas | ~8M/mes | cada una validada y puntuada por bots |

Leyenda de decisiones: **Build** (código propio), **Buy** (SaaS gestionado), **OSS** (open source autoalojado), **Híbrido** (combinación explícita).

---

## Las 13 categorías del founder

### 1. Email sending — **OSS + Build**

- **Elección:** KumoMTA autoalojado (Rust + políticas en Lua) sobre **bare metal** en 2–3 colos, con IPs propias (objetivo: ASN propio y un /21). Encima, nuestra capa de control: colas por proveedor (Gmail, Yahoo, Microsoft, Apple), pools por reputación (probation / estándar / premium / transaccional), warming programado, retirada automática de IPs listadas. Detalle en [DELIVERABILITY.md](DELIVERABILITY.md).
- **Por qué:** es *el* moat. SES, SendGrid y Postmark te venden throughput; lo que necesitamos es **control**: shaping por dominio receptor, backoff adaptativo según las respuestas 4xx de cada proveedor, aislamiento de una publicación tóxica en su propio pool en minutos. Ningún ESP te deja tocar eso. Además, el precio de lista no escala: SES a 0,10 $/1.000 son **~1M $/mes** a 10.000M emails, más ~35.000 $/mes de egress si estuviéramos en AWS.
- **Coste a escala (estimado):** ~24–30 nodos MTA bare metal con 10 Gbps sin medir (~30.000 $/mes), compra de IPv4 (/21 ≈ 2.048 IPs a ~35 $ = ~70.000 $ una vez), feeds de reputación (Spamhaus DQS, ~2.000 $/mes) y, sobre todo, **un equipo de entregabilidad de 5–6 personas** (~100.000 $/mes cargado). Total **~150.000 $/mes frente a >1M $/mes** de un ESP.
- **Honestidad:** por debajo de ~500M emails/mes esto **no es más barato** que SES; es más caro, por el equipo. Lo hacemos desde el día uno igualmente porque la reputación de IPs tarda meses en construirse y no se puede comprar después.
- **Revisar cuando:** nunca como decisión de fondo. Sí revisamos la ubicación (colo propio vs. proveedor bare metal tipo Hetzner/OVH/Latitude) cada año.
- **Plan de salida:** KumoMTA es Apache 2.0; si el proyecto muriera, PowerMTA (comercial) habla los mismos conceptos (vMTAs, colas por dominio) y nuestra capa de control es nuestra. Para incidentes, **SES está configurado como overflow frío** para transaccional de plataforma (ver categoría extra 8), no para newsletters.

### 2. Web hosting — **Buy (edge) + Buy (core)**

- **Elección:** sites de creadores en **Cloudflare Workers + Cloudflare for SaaS** (un único renderer multi-tenant, SSL automático por dominio personalizado). Núcleo (API, workers de envío, tracking en Go) en **AWS con EKS**, salvo el MTA, que vive en bare metal.
- **Por qué:** Vercel/Render cobran por despliegue y por función; nuestro caso es *un solo* despliegue que sirve 300.000 dominios. Cloudflare for SaaS es literalmente el producto para eso. El núcleo en AWS porque necesitamos Postgres, Redpanda y ClickHouse cerca, y la contratación de gente que conozca AWS es trivial.
- **Coste a escala:** Cloudflare Enterprise (Workers, for SaaS ~200.000 hostnames personalizados, WAF, Bot Management) negociado en **~40.000–60.000 $/mes**; a precio de lista solo los hostnames serían ~20.000 $/mes. AWS core (EKS, cómputo de API/ingesta, red) **~120.000–180.000 $/mes** con Savings Plans.
- **Revisar cuando:** si AWS supera ~250.000 $/mes con carga estable → mover ingesta de tracking y ClickHouse a bare metal (el patrón ya existe con el MTA).
- **Plan de salida:** el renderer del edge es TypeScript estándar con una capa de adaptador; corre en Node detrás de cualquier CDN. Los hostnames personalizados se migran con un cambio de CNAME del cliente (por eso pedimos CNAME a `sites.tirada.net`, nunca A records a IPs nuestras).

### 3. Database + queue — **Híbrido**

- **Elección:**
  - **Postgres** en Amazon RDS (Multi-AZ) en fases 1–2; particionado por `workspace_id` y particiones dedicadas para publicaciones grandes. Cuando un cluster pase de ~20 TB o el coste de RDS duela, Postgres autogestionado (Patroni) o Aurora; decisión con datos, no ahora.
  - **Redpanda** autoalojado (BYOC o en nuestro EKS) como bus, con outbox desde Postgres.
  - **ClickHouse Cloud** al principio; **autoalojado** (operador de Altinity) a partir de fase 3.
  - **Valkey** en ElastiCache for Valkey (más barato que Redis OSS gestionado, sin licencia rara).
- **Por qué:** Supabase y Neon son geniales para un MVP y malos para una plataforma con 120M suscripciones, RLS a escala y particionado manual. La "queue" del founder es en realidad tres cosas distintas: el bus de eventos (Redpanda), las colas de envío (las de KumoMTA) y los workflows (Temporal). Mezclarlas en una cola genérica es el error típico.
- **Coste a escala:** Postgres ~40.000 $/mes (varios clusters + réplicas de lectura); Redpanda ~15.000 $/mes (≈500k eventos/s pico); ClickHouse ~30.000 TB comprimidos al año, ~25.000 $/mes autoalojado frente a ~60.000+ $/mes en Cloud; Valkey ~8.000 $/mes. **~90.000–130.000 $/mes.**
- **Revisar cuando:** factura de ClickHouse Cloud > 40.000 $/mes → autoalojar. Postgres: cuando un tenant único domine un cluster.
- **Plan de salida:** todo es protocolo abierto (wire de Postgres, API Kafka, SQL de ClickHouse, protocolo Redis). Se migra con dumps, replicación lógica o MirrorMaker; ningún vendor lock-in de API.

### 4. Payments — **Buy**

- **Elección:** **Stripe Connect (Express)**, cargos directos con el creador como merchant; Stripe Billing para suscripciones; Stripe Tax (ver extra). Para nuestra propia facturación SaaS, Stripe Billing en nuestra cuenta de plataforma.
- **Por qué:** pagos, KYC, payouts en decenas de países, disputas y PCI no son un lugar para tener opiniones. Memberful es una capa encima de Stripe que no aporta nada a quien ya tiene el producto.
- **Coste a escala:** las comisiones de procesamiento (2,9 % + 0,30 $ y Billing) las paga el creador en su cuenta conectada; **0 % de comisión nuestra**. Lo que paga Tirada son las tarifas de cuenta Express: ~2 $/cuenta activa/mes + 0,25 % + 0,25 $ por payout → con 60.000 cuentas activas, **~150.000–200.000 $/mes**. Es el coste oculto del "0 % de comisión" y hay que incluirlo en el pricing por tamaño de lista.
- **Revisar cuando:** a 60.000 cuentas activas se negocia volumen con Stripe; si no hay rebaja, ofrecemos cuentas Standard (sin coste para nosotros, peor onboarding) como opción para creadores grandes que ya tienen Stripe.
- **LatAm:** Stripe no da Connect en buena parte de LatAm (p. ej. Argentina, Colombia, Chile según producto). Ahí, **Mercado Pago** (marketplace/split payments, el creador como vendedor) como **segundo proveedor**, detrás del mismo adaptador de pagos y solo en fase posterior, cuando la demanda de esos mercados lo justifique. Mismo principio: 0 % de comisión nuestra; los costes de cuenta/payout que nos cobre se repercuten en el plan.
- **Plan de salida:** los clientes y suscripciones pertenecen a la cuenta del creador, no a nosotros: si un creador se va, se lleva su Stripe intacto. Si *nosotros* tuviéramos que dejar Stripe, Adyen for Platforms es el único sustituto serio; la capa de dominio (`Tier`, `Subscription`, `Order`) no conoce Stripe salvo en un adaptador.

### 5. Auth — **Build (con piezas OSS)**

- **Elección:** auth propia: magic links de un solo uso (TTL de minutos, comparación en tiempo constante), passkeys (WebAuthn, librería SimpleWebAuthn), sesiones en Valkey, OAuth/OIDC propio para la API y el servidor MCP, y SAML para enterprise vía **Ory Polis** (antes BoxyHQ SAML Jackson) autoalojado.
- **Por qué:** hay dos poblaciones: ~500.000 usuarios de dashboard y **50M lectores**. Clerk a ~0,02 $/MAU con 10M lectores activos son ~200.000 $/mes; Auth0 bastante más. Y el login del lector es producto (login de un clic en cualquier publicación de la red, "abre en el escritorio el link que te llegó al móvil"), no un widget.
- **Coste a escala:** 2 ingenieros dedicados (~40.000 $/mes) + infraestructura marginal; los magic links salen por nuestro propio MTA transaccional.
- **Revisar cuando:** si el equipo de seguridad no puede sostener auditorías anuales de pentest del flujo, o si un cliente enterprise exige certificaciones que no tengamos (entonces Ory/WorkOS solo para SSO de dashboard).
- **Plan de salida:** todo es estándar (OIDC, WebAuthn, SAML). La tabla de usuarios y credenciales es nuestra; las passkeys están ligadas al dominio (`tirada.net`), no a un vendor.

### 6. Monitoring + alerting — **Buy (sobre OpenTelemetry) + Build para logs de envío**

- **Elección:** instrumentación **OpenTelemetry** en todo. **Sentry** (errores, frontend y backend), **Grafana Cloud** (métricas Prometheus/Mimir y trazas Tempo, logs de aplicación muestreados), **incident.io** para on-call, paging y status page. Los logs de entrega del MTA (10.000M registros/mes) **no** van a ninguna herramienta de observabilidad: van a ClickHouse, que ya es nuestro.
- **Por qué:** Datadog es excelente y su factura a esta escala es una segunda nómina (métricas custom con cardinalidad por publicación + ingesta de logs). OTel hace que el vendor sea una línea de configuración.
- **Coste a escala:** Sentry ~6.000 $/mes, Grafana Cloud ~25.000 $/mes, incident.io ~3.000 $/mes. **~35.000 $/mes.** El equivalente en Datadog con los logs del MTA estaría en 200.000+ $/mes.
- **Revisar cuando:** Grafana Cloud > 50.000 $/mes → stack LGTM autoalojado (los mismos componentes, OSS).
- **Plan de salida:** OTel → cualquier backend. Alertas como código (Terraform), dashboards exportables.

### 7. Workflow engine — **Buy: Temporal Cloud**

- **Elección:** **Temporal Cloud**, no autoalojado. Inngest y QStash descartados.
- **Por qué Temporal:** automatizaciones con esperas de semanas, ramas, reintentos de webhooks, recordatorios de webinars y entrega de productos son exactamente "código durable"; Inngest es más cómodo pero menos maduro para millones de workflows concurrentes con historiales largos, y QStash es una cola con retrasos, no un motor.
- **Por qué Cloud y no autoalojado:** Temporal autoalojado a esta escala es operar **Cassandra** (o un Postgres muy grande) más los servicios de history/matching con sharding fijo que no se puede cambiar después. Es un equipo de 2 SREs dedicados a algo que no es nuestro moat. Y, crucialmente, **la salida de Cloud a autoalojado no requiere cambiar código**: mismo SDK, mismos workflows.
- **Regla de diseño que controla el coste:** Temporal **nunca** hace el fan-out por destinatario de un envío (eso son 10.000M acciones/mes; lo hacen Redpanda y las colas de KumoMTA). Temporal orquesta *el envío* (1 workflow por campaña) y *el viaje* de cada suscriptor en una automatización.
- **Coste a escala:** estimamos ~100M inscripciones/mes en automatizaciones × ~25 acciones = ~2.500M acciones/mes. A precio negociado por volumen (~10–20 $/M acciones) son **~25.000–50.000 $/mes**.
- **Revisar cuando:** factura > 80.000 $/mes de forma sostenida, o cuando ya tengamos SREs operando Cassandra/ScyllaDB por otro motivo.
- **Plan de salida:** levantar un cluster autoalojado, enrutar los workflows *nuevos* allí y dejar que los antiguos drenen en Cloud (las automatizaciones largas expiran o se migran con `continue-as-new`).

### 8. Bot protection — **Híbrido: Cloudflare delante + scoring propio**

- **Elección:** **Cloudflare Turnstile** en formularios, **WAF + rate limiting** en el edge, Bot Management en el plan Enterprise para los sites. Detrás, un **servicio de scoring propio** (Go) que puntúa cada alta: ASN/tipo de IP, velocidad por IP/dominio/publicación, honeypots, señales de Turnstile, antigüedad del dominio del email, reputación del lector en la red, patrón de enlaces de referidos.
- **Por qué:** la capa de red (DDoS, bots volumétricos) es física y Cloudflare la hace mejor que nadie. Pero el fraude que nos cuesta dinero (altas falsas para cobrar recomendaciones pagadas, granjas de referidos, list bombing) solo se ve con **nuestros datos a nivel de red**: un lector que se suscribe a 40 publicaciones en 2 minutos desde un datacenter.
- **Coste a escala:** incluido en el contrato Enterprise de Cloudflare (categoría 2) + ~2.000 $/mes de cómputo + 1,5 ingenieros/data scientists.
- **Revisar cuando:** si el falso positivo de Turnstile en algún mercado supera el 1 %, se sustituye *solo esa pieza* (hCaptcha) detrás de la misma interfaz.
- **Plan de salida:** el scoring es nuestro; Turnstile es un widget detrás de un adaptador; el WAF son reglas en Terraform portables a otro CDN con trabajo.

### 9. Email validation — **Build (+ Kickbox para importaciones grandes, al principio)**

- **Elección:** validación propia en el momento del alta: sintaxis RFC, MX/DNS, lista de desechables (listas OSS + la nuestra), corrección de typos (`gmial.com` → `gmail.com` con sugerencia, no corrección silenciosa), cuentas de rol, y **reputación del buzón aprendida de nuestros propios rebotes**. **Kickbox** solo para importaciones de listas de terceros en fases 1–2.
- **Por qué:** con 10.000M envíos/mes somos, de facto, el mayor oráculo de "¿existe este buzón?" que podríamos comprar. ZeroBounce sobre 8M altas/mes son ~25.000 $/mes por un dato que ya tenemos. Y **no hacemos sondeo SMTP (RCPT TO) desde nuestras IPs de envío**: quema reputación; si hace falta, un pool aislado y con límites.
- **Coste a escala:** cómputo despreciable + 1 ingeniero compartido con deliverability. Kickbox en importaciones: ~0,005 $/email → una importación de 1M son ~5.000 $; **se cobra al cliente o se incluye solo en planes altos**.
- **Revisar cuando:** retiramos Kickbox cuando nuestro grafo de rebotes cubra >90 % de los dominios de las listas importadas (estimado: fase 3).
- **Plan de salida:** no aplica a la parte propia; Kickbox es intercambiable por NeverBounce o ZeroBounce detrás del mismo adaptador.

### 10. Email rendering — **Build (+ Email on Acid API en CI)**

- **Elección:** renderer propio AST → HTML con tablas y estilos inline (sin MJML), ver [EDITOR.md](EDITOR.md). **Email on Acid API** en CI: cada cambio del renderer genera capturas en ~90 combinaciones cliente/dispositivo y se comparan contra baselines.
- **Por qué:** Litmus y Email on Acid *no renderizan* emails: los fotografían. El renderizado es nuestro sí o sí; lo que compramos es la granja de Outlooks y móviles para no mantenerla nosotros.
- **Coste a escala:** Email on Acid plan empresa/API ~1.000–2.000 $/mes. Las previsualizaciones por cliente para creadores se ofrecen solo en planes altos y se pasan a coste.
- **Revisar cuando:** si el volumen de capturas crece por ofrecerlo a creadores, o si EoA degrada calidad → Litmus (más caro) o granja propia de VMs con Outlook (último recurso).
- **Plan de salida:** las suites de regresión son nuestras (fixtures de AST + baselines); el proveedor de capturas es intercambiable.

### 11. Click verification — **Build**

- **Elección:** clasificación propia de clics en dos fases. **En tiempo real** (en el redirector de Go): IP/ASN de escáneres conocidos (Microsoft Defender Safe Links, Proofpoint, Mimecast, Barracuda), user-agent, peticiones HEAD, latencia desde la entrega (<2 s), enlace honeypot invisible en cada email. **En diferido** (ClickHouse, cada pocos minutos): patrón "todos los enlaces clicados en el mismo segundo", clics sin apertura previa, correlación por destinatario y por dominio corporativo. Resultado: `click.verified_human` como métrica norte.
- **Por qué:** el founder dice que paga "una cantidad impía" a Omnivery por esto. Es exactamente la señal que necesitan la ad network (facturar clics que el anunciante crea), las recomendaciones pagadas (fraude) y el principio 4. No se terceriza la métrica por la que cobras.
- **Coste a escala:** feeds de IP intelligence (IPinfo o MaxMind, ~3.000–5.000 $/mes) + 2 ingenieros. Frente a un proveedor por volumen de clics que estimamos en decenas de miles al mes.
- **Revisar cuando:** si un anunciante grande exige verificación de terceros, añadimos un auditor externo (IAS/DoubleVerify-like) **como auditoría**, no como fuente de verdad.
- **Plan de salida:** no aplica; los eventos crudos están en ClickHouse y se pueden reprocesar con otro modelo.

### 12. Media storage + CDN — **Buy: R2 + Cloudflare Images**

- **Elección:** **Cloudflare R2** para originales (imágenes, adjuntos, audio de podcast, audio TTS) y **Cloudflare Images** para redimensionado/formato al vuelo. El vídeo no va aquí: va a Mux (extra 4).
- **Por qué:** egress cero. Los podcasts son el caso decisivo: descargas de audio a escala en S3 + CloudFront costarían decenas de miles al mes solo en transferencia. Las imágenes de email se piden miles de millones de veces (aunque el proxy de Gmail cachee).
- **Coste a escala:** ~500 TB almacenados → ~7.500 $/mes; operaciones y transformaciones únicas ~5.000–10.000 $/mes. **~15.000 $/mes** frente a ~80.000+ $/mes en S3 + CloudFront con el mismo egress.
- **Revisar cuando:** si Cloudflare empuja tráfico de audio a tarifas de bandwidth Enterprise; entonces, audio de podcast a un CDN de medios (Bunny) manteniendo R2 como origen.
- **Plan de salida:** API compatible con S3; `rclone` y a otro bucket. Las URLs públicas son nuestras (`media.tirada.net`), nunca del proveedor.

### 13. Product analytics — **Buy: PostHog Cloud (EU)**

- **Elección:** **PostHog Cloud** para la analítica de *nuestro* producto (uso del dashboard por creadores, funnels de onboarding, session replay, experimentos) y para feature flags de producto (extra 10). **La analítica de lectores y websites del creador no es esto**: es ClickHouse propio, porque es producto que vendemos.
- **Por qué:** distinguir las dos analíticas es la decisión importante. Mixpanel/PostHog sobre 3.000M pageviews de lectores costaría más que todo el resto de la lista; sobre ~200M eventos/mes de creadores es barato y útil.
- **Coste a escala:** ~200M eventos/mes + replay muestreado → **~10.000–15.000 $/mes**.
- **Revisar cuando:** > 30.000 $/mes → los eventos de producto ya pasan por Redpanda; enviarlos a nuestro ClickHouse y quedarnos PostHog solo para replay.
- **Plan de salida:** exportación por batch a S3 y SDK detrás de un wrapper `track()` propio.

---

## Lo que el founder olvidó en su lista

Categorías que una plataforma real necesita y que no estaban en la factura.

### E1. LLMs — **Buy: Claude (Anthropic API)**
- **Elección:** **Claude Opus 5.5** para el agente interno y las operaciones vía MCP (uso de herramientas, cambios con permisos); **Claude Sonnet 5.5** para el escritor (reescribir, traducir, corregir); **Claude Haiku 5.5** en batch para clasificación masiva (brand safety de campañas, moderación de comentarios, detección de publicaciones abusivas en probation).
- **Por qué:** el agente es "un usuario más" (principio 10) y lo que importa es el uso fiable de herramientas sobre nuestra API. Prompt caching y Batch API (−50 %) hacen viable la clasificación a escala.
- **Coste (estimado):** ~5M interacciones de agente/escritor al mes con contexto mayoritariamente cacheado + clasificación en batch → **~100.000–200.000 $/mes**, cubierto con créditos de IA incluidos por plan y excedentes cobrados.
- **Salida:** capa interna `llm.complete()/llm.agent()` con evals propias por tarea; cambiar de modelo es medir en las evals, no reescribir.

### E2. Generación de imágenes — **Buy, detrás de un adaptador**
- **Elección:** un proveedor de imagen de primer nivel vía API (FLUX de Black Forest Labs como primera opción, por calidad/precio y licencia comercial clara), con metadatos C2PA en cada imagen generada.
- **Coste:** ~0,03–0,05 $/imagen; ~1M imágenes/mes → **~40.000 $/mes**, dentro de los créditos de IA.
- **Salida:** cambiar de proveedor es un adaptador; el modelo de imagen es commodity y cambia cada trimestre.

### E3. Speech-to-text y TTS — **Híbrido**
- **TTS (audio de cada post):** generación **bajo demanda en la primera reproducción** y cacheado en R2, no para todos los posts. Voz por defecto con un proveedor económico; voces premium y clonación de voz del creador (con consentimiento verificado) con ElevenLabs solo en planes altos. Coste estimado: ~3.000M caracteres/mes → **~40.000–60.000 $/mes**.
- **STT (transcripciones de podcast y webinars):** **Deepgram** al principio (diarización, velocidad). Es trabajo batch perfecto para autoalojar: **Whisper (faster-whisper) en GPUs propias** cuando la factura pase de ~15.000 $/mes (~200.000 horas/mes caben en un puñado de GPUs L4).
- **Salida:** formatos estándar (WebVTT, SRT, MP3); proveedores tras adaptador.

### E4. Vídeo y webinars — **Buy: LiveKit Cloud + Mux**
- **Elección:** **LiveKit Cloud** para el escenario en tiempo real (ponentes, pantalla compartida, chat, audiencia hasta 10.000); **Mux** para grabación, VOD y venta del replay.
- **Por qué:** construir un SFU global no es nuestro negocio; LiveKit es Apache 2.0, así que la salida existe.
- **Coste (estimado):** ~150M minutos-participante/mes → **~80.000–150.000 $/mes**. Es caro y por eso **los webinars grandes se cobran como add-on**, no se regalan en el plan base.
- **Revisar cuando:** LiveKit > 100.000 $/mes sostenido → LiveKit autoalojado en bare metal con ancho de banda sin medir (mismo SDK cliente).

### E5. Búsqueda — **OSS: Postgres primero**
- **Elección:** Postgres FTS + `pg_trgm` para el dashboard (buscar suscriptores por email es un índice exacto, no un motor de búsqueda) y **pgvector** para búsqueda semántica de posts y docs del agente. Cuando la búsqueda pública en sites lo exija: **Typesense** autoalojado alimentado desde Redpanda.
- **Por qué no Elasticsearch/Algolia desde el día uno:** una pieza más (principio 8) para un problema que aún no tenemos. Algolia sobre el contenido de 300.000 publicaciones es una factura absurda.

### E6. Impuestos — **Buy: Stripe Tax**
- **Elección:** **Stripe Tax** en las cuentas conectadas (lo paga el creador, ~0,5 % por transacción con impuesto calculado, activable) y en nuestra propia facturación SaaS (registro OSS en la UE, sales tax en EE. UU.).
- **Por qué no Paddle/Lemon Squeezy como merchant of record:** contradice "el creador es el merchant" y el 0 %. Lo que sí hacemos: avisar al creador de que sigue siendo responsable de declarar, con informes listos para su gestor.

### E7. Email transaccional de la propia plataforma — **Build + Buy como respaldo**
- **Elección:** magic links, recibos, alertas y notificaciones salen por **KumoMTA en un pool transaccional dedicado** (IPs y dominio propios, `notify.tirada.net`), totalmente aislado de las newsletters. **Postmark** como respaldo contratado *solo para magic links y emails de login*. Es imprescindible durante el **cold start de IPs** (las primeras semanas, cuando el pool transaccional aún no tiene reputación y Gmail puede diferir), y después queda como standby caliente: si el pool se degrada, el login no puede caerse.
- **Coste:** Postmark en standby ~500–1.000 $/mes.

### E8. Soporte — **Híbrido**
- **Elección:** helpdesk comprado (**Plain**, API-first y con buen modelo B2B) + **primera línea con un agente propio sobre Claude** que lee el estado real de la cuenta (panel de reputación, últimos envíos, errores de dominio, webhooks fallidos) vía la misma API y MCP. Escala a humanos con el contexto ya recopilado.
- **Por qué:** el soporte de una newsletter es 70 % "¿por qué mi email fue a spam / mi dominio no verifica?". Un chatbot genérico (Intercom Fin) no ve eso; el nuestro sí.
- **Coste:** Plain ~5.000–10.000 $/mes + tokens (incluidos en E1) + el equipo humano, que no desaparece.

### E9. Feature flags — **Híbrido**
- **Elección:** flags de producto y experimentos en **PostHog** (evaluación local en servidor). **Kill switches operativos** (parar un envío, pausar un pool, congelar una publicación) en **nuestra propia tabla en Postgres replicada en Valkey**.
- **Regla:** nada que pueda parar el envío depende de un SaaS externo.

### E10. Secretos y claves — **Buy (AWS) + Build**
- **Elección:** **AWS Secrets Manager + KMS** para secretos de servicio; secretos de Workers en Cloudflare. **Claves DKIM por dominio de cliente** (cientos de miles): cifrado por sobre con KMS, almacenadas en Postgres y servidas a KumoMTA por un servicio interno con caché. Rotación automática.
- **Por qué no Vault:** licencia BSL, y otro sistema distribuido que operar; a 0,40 $/secreto, Secrets Manager tampoco sirve para claves DKIM en volumen.

### E11. CI/CD — **Buy + OSS**
- **Elección:** **GitHub + GitHub Actions** (runners autoalojados en EKS con Actions Runner Controller para builds pesados), **Argo CD** para GitOps en Kubernetes, **OpenTofu/Terraform** para infra, `wrangler` para Workers, despliegues canary con rollback automático por SLO.
- **Coste:** ~8.000–15.000 $/mes.
- **Salida:** pipelines en contenedores; el proveedor de CI es reemplazable.

---

## Resumen

| # | Categoría | Decisión | Elección | Coste estimado a escala ($/mes) |
|---|---|---|---|---|
| 1 | Email sending | OSS + Build | KumoMTA en bare metal, IPs/ASN propios | ~150k (incl. equipo) vs >1M con ESP |
| 2 | Web hosting | Buy | Cloudflare Workers + for SaaS; AWS EKS para el core | ~160k–240k |
| 3 | Database + queue | Híbrido | RDS Postgres, Redpanda, ClickHouse (Cloud → self), Valkey | ~90k–130k |
| 4 | Payments | Buy | Stripe Connect Express + Billing; Mercado Pago en LatAm (fase posterior) | ~150k–200k (tarifas Connect) |
| 5 | Auth | Build | Magic links, passkeys, OIDC propio, Ory Polis (SAML) | ~40k (equipo) |
| 6 | Monitoring | Buy sobre OTel | Sentry + Grafana Cloud + incident.io; logs MTA en ClickHouse | ~35k |
| 7 | Workflows | Buy | Temporal Cloud | ~25k–50k |
| 8 | Bot protection | Híbrido | Turnstile + WAF + scoring propio | incluido en 2 + equipo |
| 9 | Email validation | Build (+Kickbox) | Validación propia + grafo de rebotes | ~5k + importaciones a coste |
| 10 | Email rendering | Build (+EoA) | Renderer propio; Email on Acid API en CI | ~2k |
| 11 | Click verification | Build | Clasificador en tiempo real + diferido | ~5k + equipo |
| 12 | Media + CDN | Buy | R2 + Cloudflare Images | ~15k |
| 13 | Product analytics | Buy | PostHog Cloud (solo uso de creadores) | ~10k–15k |
| E1 | LLMs | Buy | Claude Opus 5.5 / Sonnet 5.5 / Haiku 5.5 | ~100k–200k (créditos IA) |
| E2 | Imagen | Buy | FLUX vía API, tras adaptador | ~40k |
| E3 | STT / TTS | Híbrido | Deepgram → Whisper propio; TTS bajo demanda | ~60k–80k |
| E4 | Vídeo | Buy | LiveKit Cloud + Mux | ~80k–150k (add-on) |
| E5 | Búsqueda | OSS | Postgres FTS + pgvector → Typesense | marginal |
| E6 | Impuestos | Buy | Stripe Tax | lo paga el creador |
| E7 | Transaccional propio | Build + Buy | Pool KumoMTA dedicado + Postmark (cold start y standby de login) | ~1k |
| E8 | Soporte | Híbrido | Plain + agente propio con Claude | ~10k + equipo |
| E9 | Feature flags | Híbrido | PostHog + kill switches propios | incluido |
| E10 | Secretos | Buy + Build | Secrets Manager + KMS; DKIM cifrado propio | ~2k |
| E11 | CI/CD | Buy + OSS | GitHub Actions + Argo CD + OpenTofu | ~10k |

**Orden de magnitud total de proveedores e infraestructura a escala: ~1,2–1,7M $/mes**, de los cuales una parte relevante (IA, vídeo, impuestos, validación de importaciones) se repercute en planes o add-ons. El mismo volumen con "el stack del tweet" a precio de lista (SES, Clerk, Datadog con logs, Omnivery, ZeroBounce, Vercel, S3) superaría con holgura los **3M $/mes**, y sin el control de reputación que es el producto.

---

## Dónde el founder tiene razón

- **No se hace en un fin de semana.** Esta tabla tiene 24 filas, y cada fila "Build" es un equipo, no una tarde. Solo las categorías 1, 9 y 11 requieren gente con años de experiencia en entregabilidad que no se contrata en un mes.
- **"Pagar y coser" es el coste real.** Ningún proveedor es caro en sí; lo caro es la costura: idempotencia entre Stripe y nuestros tiers, eventos entre MTA y analítica, permisos entre auth y agente. Por eso nuestro principio 2 (todo es un evento) existe.
- **Pagos y vídeo en vivo no se construyen.** Coincidimos al 100 %: Stripe Connect y LiveKit/Mux.
- **El filtrado de clics bot es caro y crítico.** Tiene razón en ambas cosas. Por eso mismo lo construimos.
- **"Para siempre" es lo que mata.** El coste de mantener 13 integraciones durante años supera el de construirlas. Nuestra respuesta son adaptadores, protocolos abiertos y un plan de salida por línea.

## Dónde no

- **"Email sending" no es una línea de factura, es el negocio.** Ponerlo junto a "SendGrid, SES, Postmark" sugiere que se compra. Si lo compras, no tienes el moat que el propio founder describe en las primeras 15 líneas de su backlog (warming, feedback loops, blocklists, pools). Ninguna de esas features es posible encima de un ESP compartido.
- **Auth no se compra a 50M lectores.** Clerk/Auth0 tienen sentido para el dashboard de un SaaS, no para la identidad de lector de una red de newsletters. Y el login del lector es producto.
- **Validación de emails y verificación de clics deberían ser outputs, no inputs.** Con 10.000M envíos al mes, *eres* la fuente de verdad de qué buzones existen y qué clics son humanos. Pagar a ZeroBounce y Omnivery a esa escala es comprar tus propios datos con margen.
- **"Database + queue" son al menos tres sistemas.** Mezclar bus de eventos, colas de envío y workflows durables en "una cola" es el error de diseño más común en este tipo de plataformas, y la lista lo invita.
- **Litmus/Email on Acid no "renderizan" emails.** El renderer siempre fue tuyo; lo que se compra es una granja de capturas para CI.
- **Product analytics ≠ analítica del creador.** Si metes 3.000M pageviews de lectores en PostHog o Mixpanel, la factura supera a la del envío. La analítica de lectores es producto y vive en ClickHouse propio.
- **Faltan las líneas que más crecen.** LLMs, TTS/STT, vídeo, impuestos y soporte son, a escala, más caros que la mitad de su lista. La lista del founder es la de 2022; la factura de 2026 es otra.
