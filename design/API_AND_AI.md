# API, webhooks, MCP, agente de IA y auth

> Principio 3 del [README](README.md): **el dashboard usa la misma API pública que los clientes**. Principio 10: **la IA es un usuario más**. Este documento es la consecuencia práctica de ambos: una única superficie (REST + eventos) de la que cuelgan el SDK, los webhooks, el servidor MCP, el agente interno y el propio dashboard, todo bajo un único modelo de permisos y un único audit log.

Relacionados: el bus de eventos y el outbox están en [ARCHITECTURE.md](ARCHITECTURE.md); el AST del documento y los renderers, en [EDITOR.md](EDITOR.md); el DSL de segmentos y el motor de automatizaciones, en [PLATFORM.md](PLATFORM.md); tiers, ad network y productos, en [GROWTH_AND_MONETIZATION.md](GROWTH_AND_MONETIZATION.md); métricas por proveedor, en [DELIVERABILITY.md](DELIVERABILITY.md); fases, en [ROADMAP.md](ROADMAP.md).

```
                  ┌────────────── OpenAPI 3.1 (fuente única) ──────────────┐
                  │                                                         │
   Dashboard ──► REST API (TS, Fastify) ◄── SDK TS/Python/Go (generados)     │
   Agente Cmd+K ─┤        │                                                 │
   MCP server ───┘        ├─► Postgres (outbox) ─► Redpanda ─► Webhooks (Temporal)
                          ├─► ClickHouse (vía semantic layer, solo lectura)  │
                          └─► Audit log (append-only)                        │
                  └─────────────────────────────────────────────────────────┘
```

---

## 1. REST API

### 1.1 Reglas de diseño (no negociables)

| Regla | Decisión |
|---|---|
| Base URL | `https://api.tirada.com/v1`. El `/v1` solo cambia si rehacemos el modelo entero (nunca, esperamos). |
| Orientada a recursos | Sustantivos en plural, verbos HTTP estándar. Las acciones que no son CRUD son sub-recursos con `POST`: `/posts/{id}/send`, `/subscriptions/{id}/pause`. Nada de `/doSomething`. |
| IDs | Opacos, con prefijo de tipo y orden temporal (UUIDv7 en base32): `sub_01J9Z...`, `post_...`, `seg_...`, `pub_...`. El prefijo hace los logs legibles y evita pegar un ID en el endpoint equivocado. |
| Ámbito | Casi todo cuelga de `/publications/{pub_id}/...`. Recursos de workspace (miembros, API keys, webhooks, facturación) cuelgan de `/workspace/...`. |
| Formato | JSON, `snake_case`, fechas ISO 8601 en UTC, dinero como `{ "amount": 1200, "currency": "eur" }` en unidades menores. |
| Versionado por fecha | Header `Tirada-Version: 2026-10-01`. La key fija una versión por defecto al crearse; el header la sobrescribe por petición. |
| Idempotencia | Header `Idempotency-Key` aceptado en **todo** `POST`/`PATCH`; obligatorio en `/send`, cobros y jobs bulk. |
| Paginación | Por cursor (keyset), nunca por offset. |
| Expansión | `?expand[]=tier&expand[]=custom_fields`, máximo 3 niveles. |
| Errores | Un único envelope, tipos estables, `request_id` siempre. |
| Escrituras | Síncronas y en tiempo real para objetos individuales; asíncronas (job) para todo lo que toca más de 1.000 filas. |

#### Versionado por fecha, estilo Stripe

Cada cambio incompatible se registra como un **version change** con fecha y un par de transformaciones (`request_down`, `response_down`). El core siempre trabaja con la última forma; en el borde, un middleware aplica en cadena las transformaciones hacia atrás hasta la versión pedida. Consecuencias:

- Los clientes **nunca** se rompen por un deploy; actualizan cuando quieren, probando con el header antes de cambiar el default de la key.
- Los **webhooks** se serializan con la versión fijada en cada endpoint (ver §2), con el mismo motor.
- El dashboard y el MCP siempre usan la última versión.
- Cambios aditivos (campo nuevo, evento nuevo, valor de enum nuevo documentado como "abierto") no generan versión.

```http
GET /v1/publications/pub_01J9ZK/subscribers/sub_01JA2X HTTP/1.1
Authorization: Bearer trd_live_k7Qp...
Tirada-Version: 2026-10-01
```

#### Idempotencia

La clave se guarda en Valkey 24 h con `(key_id, idempotency_key) → hash(body), status, response`. Misma clave y mismo body: se devuelve la respuesta original con `Idempotent-Replayed: true`. Misma clave y body distinto: `409 idempotency_key_reused`. Petición en vuelo con la misma clave: `409 request_in_progress`. Para `/send` la clave además se persiste en Postgres junto al envío, porque un doble envío a 2 millones de personas no se arregla con una disculpa.

#### Paginación keyset (por qué el offset no sirve)

`OFFSET 2000000 LIMIT 100` obliga a Postgres a leer y descartar dos millones de filas, y además es inestable: si alguien se suscribe mientras paginas, ves duplicados o te saltas filas. Con keyset, el cursor codifica **la última clave vista** y la consulta usa el índice directamente:

```sql
-- índice: (publication_id, created_at, id)
SELECT * FROM subscribers
WHERE publication_id = $1
  AND (created_at, id) > ($cursor_created_at, $cursor_id)
ORDER BY created_at, id
LIMIT 101;  -- uno extra para saber si hay más
```

Coste constante en la página 1 y en la 20.000. El cursor es opaco (base64url de `{sort, last_values, filters_hash}` firmado con HMAC para que no se pueda manipular) y solo admite los órdenes que tienen índice: `created_at`, `updated_at`, `email` (para exports deterministas). Si los filtros cambian entre páginas, `400 cursor_mismatch`.

```http
GET /v1/publications/pub_01J9ZK/subscribers?limit=100&status=active&sort=created_at
```
```json
{
  "object": "list",
  "data": [ { "id": "sub_01JA2X", "email": "ana@ejemplo.com", "status": "active" } ],
  "has_more": true,
  "next_cursor": "eyJzIjoiY3JlYXRlZF9hdCIsInYiOlsiMjAyNi0xMC0xNFQxMDowMDowMFoiLCJzdWJfMDFKQTJYIl19.h7k",
  "total_count_estimate": 1843211
}
```

No devolvemos un `total_count` exacto en listas grandes (`COUNT(*)` sobre millones es caro); damos `total_count_estimate` desde el bitmap del segmento o las estadísticas de la tabla, y `?include=total_count` exacto solo bajo 100.000 filas.

#### Envelope de errores

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "custom_field_unknown",
    "message": "El campo personalizado 'plan_empresa' no existe en esta publicación.",
    "param": "custom_fields.plan_empresa",
    "doc_url": "https://docs.tirada.com/errors#custom_field_unknown",
    "request_id": "req_01JA3B9Q"
  }
}
```

| `type` | HTTP | Ejemplos de `code` |
|---|---|---|
| `invalid_request_error` | 400 / 404 / 422 | `parameter_missing`, `email_invalid`, `email_disposable`, `cursor_mismatch` |
| `authentication_error` | 401 | `api_key_revoked`, `api_key_expired` |
| `permission_error` | 403 | `scope_missing` (incluye `required_scope`), `role_insufficient` |
| `conflict_error` | 409 | `idempotency_key_reused`, `subscriber_exists`, `version_conflict` |
| `rate_limit_error` | 429 | `rate_limited`, `concurrent_jobs_exceeded` |
| `compliance_error` | 422 | `suppressed_address`, `send_blocked_complaint_rate`, `preflight_failed` |
| `api_error` | 5xx | `internal` (con `request_id` para soporte) |

### 1.2 Catálogo de recursos y endpoints

Prefijo implícito: `/v1/publications/{pub_id}` salvo que empiece por `/v1/workspace`. Scope requerido en la última columna (ver §1.4).

#### Suscriptores, campos y tags

| Método | Ruta | Qué hace | Scope |
|---|---|---|---|
| `POST` | `/subscribers` | Crea o hace upsert (`?on_conflict=update`). Valida email (sintaxis, MX, desechables, typos) en línea; respeta doble opt-in. | `subscribers:write` |
| `GET` | `/subscribers` | Lista con filtros (`status`, `tier`, `tag`, `source`, `created_after`…) | `subscribers:read` |
| `GET` | `/subscribers/{id}` · `/subscribers/by-email/{email}` | Lectura; `expand[]=engagement,subscriptions,custom_fields,referrals` | `subscribers:read` |
| `PATCH` | `/subscribers/{id}` | Actualiza campos, listas, estado | `subscribers:write` |
| `DELETE` | `/subscribers/{id}` | Baja + borrado GDPR (`?erase=true` anonimiza en ClickHouse por job) | `subscribers:delete` |
| `GET` | `/subscribers/{id}/events` | Historial completo: envíos, aperturas verificadas, clics humanos, visitas, compras, cambios de tier, enrolments | `subscribers:read` |
| `GET/POST/PATCH/DELETE` | `/custom-fields[/{key}]` | Definición tipada: `string`, `number`, `boolean`, `date`, `enum`, `list` | `fields:write` |
| `PUT` | `/subscribers/{id}/custom-fields/{key}` | Escribe un valor puntual | `subscribers:write` |
| `GET/POST/DELETE` | `/tags[/{tag}]` | Catálogo de tags | `subscribers:write` |
| `POST/DELETE` | `/subscribers/{id}/tags/{tag}` | Etiquetar/desetiquetar desde tu app (idempotente) | `subscribers:write` |
| `POST` | `/subscribers/bulk` | Hasta 100.000 upserts/ops por job (NDJSON o URL a fichero) | `subscribers:write` |
| `GET/POST` | `/lists` · `/lists/{id}/members` | Múltiples newsletter lists por publicación | `subscribers:write` |

```http
POST /v1/publications/pub_01J9ZK/subscribers?on_conflict=update
Idempotency-Key: signup-8f2c1e
Content-Type: application/json

{
  "email": "ana@ejemplo.com",
  "lists": ["lst_diario", "lst_semanal"],
  "custom_fields": { "empresa": "Acme", "plan_empresa": "pro" },
  "tags": ["webinar-oct"],
  "source": { "channel": "api", "utm_source": "app", "utm_campaign": "onboarding" },
  "double_opt_in": "publication_default",
  "automations": ["aut_bienvenida"]
}
```
```json
{
  "id": "sub_01JA2X", "object": "subscriber", "email": "ana@ejemplo.com",
  "status": "pending_confirmation", "created": true,
  "source": { "channel": "api", "utm_source": "app", "utm_campaign": "onboarding" },
  "validation": { "result": "deliverable", "did_you_mean": null },
  "automations": [ { "id": "aut_bienvenida", "enrollment_id": "enr_01JA2Y", "state": "waiting_confirmation" } ]
}
```

#### Posts, plantillas y renderizado

| Método | Ruta | Qué hace | Scope |
|---|---|---|---|
| `POST` | `/posts` | Crea borrador vacío, desde Markdown/HTML, o `from_template` | `posts:write` |
| `GET/PATCH/DELETE` | `/posts/{id}` | CRUD; `PATCH` con `If-Match: <revision>` para no pisar a un humano editando en Yjs | `posts:write` |
| `POST` | `/posts/{id}/content/append` · `/content/prepend` | Añade bloques al final/principio (AST o Markdown) | `posts:write` |
| `GET` | `/posts/{id}/rendered?channel=email\|web&audience=free\|premium` | HTML final renderizado, la matriz 2×2 completa | `posts:read` |
| `GET` | `/posts/{id}/rendered?…&subscriber_id=sub_…` | Con merge tags y contenido dinámico resueltos para un lector (el "simulated subscriber") | `posts:read` |
| `POST` | `/posts/{id}/preflight` | Tamaño (umbral 102 KB), enlaces, alt text, merge tags sin fallback, spam score | `posts:read` |
| `POST` | `/posts/{id}/schedule` · `/unschedule` | Programar envío/publicación | `posts:send` |
| `GET/POST` | `/templates` · `/templates/{id}/duplicate` | Plantillas compartidas del equipo | `templates:write` |

Los posts creados desde plantilla **referencian** la plantilla (estilos, footer, slots de sponsor) en vez de copiarla, así que un cambio de plantilla se refleja al instante en los posts API no enviados (ver [EDITOR.md](EDITOR.md)).

```http
POST /v1/publications/pub_01J9ZK/posts
{
  "from_template": "tpl_resumen_semanal",
  "title": "Resumen semanal #142",
  "authors": ["usr_lucia", "gst_pedro"],
  "content": { "format": "markdown", "body": "## Lo más leído\n\n..." },
  "audiences": { "email": true, "web": true }
}
```
```http
POST /v1/publications/pub_01J9ZK/posts/post_01JA4/content/append
{ "format": "ast", "blocks": [ { "type": "paywall_break" }, { "type": "paragraph", "visibility": ["premium"], "text": "Solo para suscriptores de pago..." } ] }
```

#### Send API

| Método | Ruta | Qué hace | Scope |
|---|---|---|---|
| `POST` | `/posts/{id}/send` | Envía un post existente (programado o inmediato) | `posts:send` |
| `POST` | `/sends` | Crea y envía en una sola llamada (contenido + audiencia + opciones) | `posts:send` |
| `GET` | `/sends/{id}` | Estado: `queued → preflight → sending (x %) → sent`, por proveedor | `posts:read` |
| `POST` | `/sends/{id}/cancel` | Cancela lo que no haya salido aún | `posts:send` |
| `POST` | `/sends/{id}/test` | Envía prueba a hasta 10 direcciones del equipo | `posts:write` |

```http
POST /v1/publications/pub_01J9ZK/posts/post_01JA4/send
Idempotency-Key: send-post_01JA4-v1

{
  "audience": { "lists": ["lst_diario"], "segments_include": ["seg_activos_90d"], "segments_exclude": ["seg_compradores"] },
  "subject_test": { "variants": ["Lo que nadie te contó de X", "X, explicado en 5 min"], "sample_pct": 20, "winner_metric": "verified_clicks", "decide_after": "PT2H" },
  "scheduled_at": "2026-10-16T07:00:00Z",
  "preflight": "block_on_errors"
}
```

`preflight: "block_on_errors"` es el default por API; el envío se rechaza con `422 preflight_failed` y la lista de problemas. Además, el kill-switch de quejas ([DELIVERABILITY.md](DELIVERABILITY.md)) puede devolver `send_blocked_complaint_rate` y ningún scope lo salta.

#### Segmentos

| Método | Ruta | Qué hace | Scope |
|---|---|---|---|
| `GET/POST/PATCH/DELETE` | `/segments[/{id}]` | Dinámicos (DSL) o estáticos (lista fija) | `segments:write` |
| `POST` | `/segments/{id}/recalculate` | Recalcula bajo demanda; devuelve job | `segments:write` |
| `GET` | `/segments/{id}/members` | Paginado keyset sobre el roaring bitmap | `segments:read` |
| `GET` | `/segments/{id}/members/stream` | NDJSON en streaming (`Transfer-Encoding: chunked`), sin paginar, para sincronizar millones | `segments:read` |
| `POST` | `/segments/{id}/exports` | Export CSV/Parquet a URL firmada (R2, 24 h) | `exports:create` |
| `POST` | `/segments/{id}/add-to-list` | Añade el segmento entero a una list | `subscribers:write` |
| `GET/POST` | `/condition-sets` | Condiciones reutilizables entre segmentos y automatizaciones | `segments:write` |

#### Automatizaciones

| Método | Ruta | Qué hace | Scope |
|---|---|---|---|
| `GET/POST/PATCH` | `/automations[/{id}]` | Definición; `PATCH` siempre edita la rama **draft** | `automations:write` |
| `GET` | `/automations/{id}/diff` | Diff draft vs. live | `automations:read` |
| `POST` | `/automations/{id}/publish` | Publica el draft (migra enrolments en vuelo según la regla elegida) | `automations:publish` |
| `POST` | `/automations/{id}/enrollments` | Inscribe un suscriptor (o hasta 10.000 en lote) | `automations:enroll` |
| `GET` | `/automations/{id}/enrollments/{enr}` | Journey: paso actual, historial, aperturas/clics por email | `automations:read` |
| `DELETE` | `/automations/{id}/enrollments/{enr}` | Saca a alguien del flujo | `automations:enroll` |

#### Monetización, crecimiento y engagement

| Recurso | Endpoints principales | Scope |
|---|---|---|
| Tiers | `GET/POST/PATCH /tiers`, `POST /tiers/{id}/pause\|resume`, `DELETE /tiers/{id}` (solo sin suscriptores activos) | `tiers:write` |
| Suscripciones premium | `GET /subscriptions`, `POST /subscriptions` (comp/gift), `POST /subscriptions/{id}/pause\|resume\|cancel`, `PATCH` (cambio de tier, con prorrateo) | `payments:write` |
| Ofertas, trials | `GET/POST /offers` (descuentos, trials gratis y de pago) | `payments:write` |
| Referidos | `GET /referral-program`, `GET /referral-program/milestones`, `GET /subscribers/{id}/referrals`, `GET /referrals?milestone=…` | `growth:read` |
| Recomendaciones | `GET /recommendations`, `GET /recommendations/{id}/insights`, `POST …/pause\|resume\|end` | `growth:write` |
| Polls/encuestas | `GET /surveys`, `GET /surveys/{id}/responses` (keyset), `GET /surveys/{id}/results` (agregado por pregunta), `GET /polls/{id}/results` | `surveys:read` |
| Productos | `GET/POST/PATCH /products`, `/products/{id}/variants`, `POST /products/{id}/duplicate`, `GET /orders` | `commerce:write` |
| Cupones | `GET/POST /coupons`, `POST /coupons/{id}/promotion-codes`, `DELETE` (desactiva) | `commerce:write` |
| Ads | `GET /ad-opportunities?status=available`, `POST /ad-opportunities/{id}/accept\|decline`, `GET /ad-placements`, `GET /reports/ad-revenue?group_by=post` | `ads:write` |
| Patrocinios directos | `GET/POST /sponsorships`, `/sponsorship-products` | `ads:write` |

#### Analítica

Todas las lecturas van a ClickHouse a través de la **semantic layer** (§4.3), nunca SQL libre.

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/posts/{id}/stats` | Entregados, aperturas brutas y verificadas (sin MPP ni escáneres), clics humanos verificados, CTR, bajas, quejas, revenue atribuido |
| `GET` | `/posts/{id}/stats/by-provider` | Lo mismo agrupado por `gmail`, `yahoo`, `outlook`, `apple`, `other`, más deferrals y bounces |
| `GET` | `/posts/{id}/stats/links` | Clics por enlace (humanos vs. bots filtrados) |
| `GET` | `/posts/{id}/recipients?event=clicked` | Engagement por lector, keyset |
| `POST` | `/analytics/query` | Consulta a la semantic layer: métricas + dimensiones + filtros (ver §4.3) |
| `GET` | `/reports/growth` · `/reports/earnings` | Series temporales de suscriptores (por fuente) y de ingresos (suscripciones, ads, productos, eventos) |
| `GET` | `/website/analytics` | Tráfico, canales, referrers, crawlers de IA servidos/bloqueados |

#### Podcast, website y comunidad

| Recurso | Endpoints | Scope |
|---|---|---|
| Shows | `GET/POST/PATCH /podcasts[/{id}]` (categorías Apple, metadatos, `rss_redirect`) | `podcasts:write` |
| Episodios | `GET/POST/PATCH/DELETE /podcasts/{id}/episodes`, `POST …/archive`, `POST …/schedule`, `GET …/transcript`, `GET …/stats` (IAB: descargas, oyentes únicos, país/app/dispositivo) | `podcasts:write` |
| Importación | `POST /podcasts/imports` (`rss_url`, preserva GUIDs; job) | `podcasts:write` |
| Páginas | `GET/POST/PATCH /website/pages`, `POST /website/pages/{id}/publish`, `GET …/versions`, `POST …/versions/{v}/restore` | `website:write` |
| Redirects | `GET/POST/DELETE /website/redirects` (301/302, wildcards, bulk CSV) | `website:write` |
| SEO | `PATCH /website/seo` (robots.txt, crawlers permitidos, sitemap), `PATCH /website/pages/{id}/seo`, `PATCH /posts/{id}/seo` | `website:write` |
| Comunidad | `GET/POST /community/channels`, `GET/POST /community/posts`, `POST /community/posts/{id}/comments`, `POST …/pin`, `GET /community/moderation-queue`, `POST /community/members/{id}/ban\|unban` | `community:write` |
| DMs | `GET /community/conversations`, `POST /community/conversations/{id}/messages` | `community:dm` |

### 1.3 Rate limits, bulk y jobs asíncronos

**Doble token bucket en Valkey** (script Lua atómico, una llamada por petición):

| Bucket | Capacidad (burst) | Recarga | Notas |
|---|---|---|---|
| Por API key | 200 | 50 req/s | Protege de un bug en un cliente concreto |
| Por workspace | 600 | 150 req/s | Suma de todas las keys + MCP + agente; el dashboard va en un bucket aparte |
| Escrituras caras (`/send`, `/exports`, `/recalculate`) | 10 | 1 cada 6 s | Coste, no tráfico |
| Jobs concurrentes por workspace | 5 en vuelo | — | `429 concurrent_jobs_exceeded` |
| Enterprise | Configurable por contrato | | |

Las peticiones tienen **coste** (no todas valen 1): un `GET` simple vale 1, un `GET` con `expand` vale 1 + niveles, `/analytics/query` vale entre 2 y 10 según el rango temporal. Headers en **todas** las respuestas (formato del draft IETF `RateLimit`):

```http
RateLimit-Policy: "key";q=200;w=4, "workspace";q=600;w=4
RateLimit: "key";r=143;t=1
Retry-After: 2            # solo en 429
```

**Para no bloquear integraciones reales**: cualquier cosa que toque muchas filas tiene versión bulk asíncrona que consume **un** token y devuelve un job:

```http
POST /v1/publications/pub_01J9ZK/subscribers/bulk
Idempotency-Key: import-crm-2026-10-15
{ "operation": "upsert", "source_url": "https://crm.ejemplo.com/export.ndjson", "notify_webhook": true }
```
```json
{ "id": "job_01JA5", "object": "job", "status": "queued", "progress": { "processed": 0, "total": null }, "result_url": null }
```

`GET /v1/jobs/{id}` para el estado; evento `job.completed` por webhook; el resultado (filas OK, rechazadas con motivo) en NDJSON a URL firmada. Los jobs corren como workflows Temporal con su propio rate de escritura a Postgres, así que un import de 2 millones no degrada al resto del tenant.

### 1.4 API keys

- **Formato**: `trd_{live|test}_{8 chars de prefijo}_{32 bytes aleatorios base62}`. El prefijo `trd_` permite el **secret scanning** de GitHub (registramos el patrón) y revocación automática si aparece en un repo público.
- **Almacenamiento**: se muestra **una vez**. Guardamos `prefix` (en claro, para identificarla en la UI y en logs) y `SHA-256(key)` (no hace falta bcrypt: 256 bits de entropía no se pueden atacar por diccionario, y el hash rápido permite lookup O(1)). Comparación en tiempo constante.
- **Scopes**: `recurso:acción` (`subscribers:read`, `posts:send`, `exports:create`…), opcionalmente limitados a publicaciones concretas. Una key **nunca** puede tener más permisos que el rol de quien la crea, y se degrada si el creador baja de rol (ver §5.6).
- **Modo test**: `trd_test_` opera sobre un sandbox de la publicación; los envíos solo llegan a direcciones del equipo.
- **Metadatos visibles**: nombre, creador, scopes, `last_used_at`, `last_used_ip`, user-agent, contador de 30 días, fecha de expiración opcional.
- **Rotación**: `POST /v1/workspace/api-keys/{id}/roll` emite una key nueva y deja la vieja viva un periodo de gracia (`expires_in`: 0 a 7 días). Las keys sin uso en 90 días se marcan y se notifica a los admins.
- **Revocación**: inmediata; la caché de auth en Valkey se invalida por pub/sub en todas las réplicas en menos de 1 s.

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/v1/workspace/api-keys` | Lista (sin secretos) |
| `POST` | `/v1/workspace/api-keys` | Crea `{ name, scopes, publications, expires_at, default_version }` |
| `POST` | `/v1/workspace/api-keys/{id}/roll` | Rota con periodo de gracia |
| `DELETE` | `/v1/workspace/api-keys/{id}` | Revoca |

---

## 2. Webhooks

Los webhooks son **un consumidor más del bus** ([ARCHITECTURE.md](ARCHITECTURE.md)): un servicio lee Redpanda, filtra por suscripciones de endpoint y arranca un workflow Temporal por entrega. Garantía: **at-least-once**, con `id` de evento estable para deduplicar. Orden no garantizado; cada payload lleva `created` y, cuando aplica, la `revision` del objeto.

### 2.1 Catálogo de eventos

| Evento | Se emite cuando |
|---|---|
| `subscriber.created` | Alta (incluye `source` y estado `pending_confirmation` o `active`) |
| `subscriber.confirmed` | Confirma el doble opt-in |
| `subscriber.updated` | Cambian campos, tags o estado |
| `subscriber.deleted` | Baja definitiva o borrado GDPR |
| `subscriber.unsubscribed` | Baja de la publicación (incluye `method`: `one_click`, `link`, `complaint`, `api`) |
| `list.subscribed` · `list.unsubscribed` | Entra o sale de una newsletter list |
| `subscription.upgraded` · `subscription.downgraded` | Cambio de tier (de free a paid o entre tiers) |
| `subscription.paused` · `subscription.resumed` | Pausa/reanudación de una suscripción premium |
| `subscription.canceled` · `subscription.trial_ending` · `subscription.payment_failed` | Ciclo de vida de pago |
| `tier.created` · `tier.updated` · `tier.deleted` | Gestión de tiers |
| `tier.paused` · `tier.resumed` | Se pausan/reanudan nuevas altas en un tier |
| `post.scheduled` · `post.updated` · `post.published` · `post.sent` | Ciclo de vida del post (`post.sent` al terminar el envío, con totales) |
| `send.failed` · `send.blocked` | Envío detenido por preflight o kill-switch |
| `survey.response.created` · `poll.response.created` | Respuesta (con `subscriber_id` y respuestas por pregunta) |
| `referral.created` · `referral.milestone_reached` | Programa de referidos |
| `podcast.episode.published` · `.updated` · `.archived` · `.deleted` | Episodios |
| `podcast.private_feed.access_granted` · `.access_revoked` · `.accessed` | Feeds privados (alta, baja y uso de URL personal); una rotación de token emite `access_revoked` + `access_granted` con `reason: "rotated"` |
| `order.completed` · `order.refunded` | Productos y entradas |
| `automation.enrollment.started` · `.completed` · `.exited` | Journeys |
| `community.member.joined` · `community.post.reported` | Comunidad |
| `job.completed` · `job.failed` | Jobs bulk |
| `webhook_endpoint.disabled` | Auto-deshabilitado por fallos (se envía por email también) |

### 2.2 Endpoints, selección de eventos y payload

```http
POST /v1/workspace/webhook-endpoints
{
  "url": "https://hooks.ejemplo.com/tirada",
  "events": ["subscriber.created", "subscriber.confirmed", "subscription.*"],
  "publications": ["pub_01J9ZK"],
  "api_version": "2026-10-01",
  "description": "Sync con CRM"
}
```

Cada endpoint elige exactamente sus eventos (con comodines por familia), sus publicaciones y su **versión de payload** fijada. Los payloads son *snapshots* del objeto en esa versión, no deltas:

```json
{
  "id": "evt_01JA6M",
  "type": "subscription.upgraded",
  "api_version": "2026-10-01",
  "created": "2026-10-15T09:12:44Z",
  "workspace_id": "wsp_01J9", "publication_id": "pub_01J9ZK",
  "data": {
    "object": { "id": "subs_01JA6", "object": "subscription", "subscriber_id": "sub_01JA2X", "tier": "tier_pro", "interval": "year", "status": "active" },
    "previous_attributes": { "tier": "tier_free" }
  }
}
```

### 2.3 Firma y rotación de secretos

Headers en cada entrega:

```http
Tirada-Webhook-Id: evt_01JA6M
Tirada-Webhook-Timestamp: 1792055564
Tirada-Signature: v1=5f2b...e9, v1=a81c...04
```

`v1 = hex(HMAC-SHA256(secret, "{timestamp}.{raw_body}"))`. El receptor rechaza si `|now - timestamp| > 300 s` (anti-replay) y compara en tiempo constante. **Rotación con doble secreto**: `POST /webhook-endpoints/{id}/secret/roll` crea un secreto nuevo y durante 24 h (configurable) firmamos con ambos, por eso el header puede llevar dos firmas. El SDK trae `tirada.webhooks.verify(rawBody, headers, secret)`.

### 2.4 Reintentos, log y operación

Cada entrega es un workflow Temporal con política de reintento exponencial con jitter, durante **3 días**:

| Intento | Espera aprox. | Acumulado |
|---|---|---|
| 1 | inmediato | 0 |
| 2 | 30 s | 30 s |
| 3 | 2 min | ~3 min |
| 4 | 10 min | ~13 min |
| 5 | 1 h | ~1,2 h |
| 6 | 3 h | ~4 h |
| 7 | 8 h | ~12 h |
| 8–10 | 12 h cada uno | ~3 días |

- Éxito = 2xx en menos de 10 s. `410 Gone` deshabilita el endpoint al momento. 3xx no se sigue.
- **Auto-disable**: si un endpoint acumula 100 % de fallos durante 3 días se pasa a `disabled_auto` y se avisa por email + evento `webhook_endpoint.disabled`.
- **Log de intentos**: cada intento se guarda 30 días (ClickHouse): request headers, body, status, response (primeros 4 KB), latencia, error de red. `GET /webhook-endpoints/{id}/deliveries?status=failed`.
- **Reintento manual**: `POST /webhook-deliveries/{id}/retry`, o bulk `POST /webhook-endpoints/{id}/replay { "since": "...", "status": "failed" }` (reutiliza Temporal; posible porque el bus es rebobinable).
- **Deshabilitar sin borrar**: `PATCH { "status": "disabled" }` conserva configuración, secreto y log; mientras está deshabilitado los eventos **no** se encolan (opción `buffer_while_disabled: true` hasta 72 h).
- **Endpoint de prueba**: `POST /webhook-endpoints/{id}/test { "type": "subscriber.created" }` envía un evento de ejemplo firmado.

### 2.5 Pasos webhook dentro de automatizaciones

El paso "Webhook" del builder ([PLATFORM.md](PLATFORM.md)) usa la misma maquinaria de firma, pero dentro del workflow Temporal del journey y con su propia política de reintentos (backoff 30 s → 6 h, máximo 24 h; detalle en [PLATFORM.md](PLATFORM.md)): el paso puede ser *fire-and-forget* o **bloqueante** (el journey espera la respuesta y puede ramificar con su JSON, por ejemplo `response.body.plan == "enterprise"`). Payload: el suscriptor serializado + `automation_id`, `enrollment_id`, `step_id`. Si se agotan los reintentos, el journey hace `continue` o `exit` según lo configurado en el paso.

---

## 3. Servidor MCP

### 3.1 Arquitectura

- **Remoto**, en `https://mcp.tirada.com`, transporte Streamable HTTP. Nada que instalar: el usuario pega la URL en Claude, ChatGPT, Cursor, etc.
- **Auth OAuth 2.1** con PKCE obligatorio y Dynamic Client Registration, según la spec de autorización de MCP. Pantalla de consentimiento que muestra workspace, publicaciones y scopes pedidos. Tokens de acceso de 1 h, refresh rotativo; el usuario ve y revoca conexiones en *Ajustes → Apps conectadas*.
- **Dos capas de herramientas**:
  1. **Generadas** del OpenAPI (un tool por operación, con el JSON Schema del endpoint). Cubren el 100 % de la API automáticamente, pero por defecto se exponen **agrupadas por dominio** y cargadas bajo demanda (`tirada_list_tools(domain)`) para no inundar el contexto del modelo con 200 herramientas.
  2. **Curadas**: unas 40 herramientas de alto nivel, pensadas para cómo habla la gente, que componen varias llamadas y devuelven respuestas compactas y legibles (tablas pequeñas, no JSON de 50 KB).
- Las herramientas curadas viven en el mismo repo y se testean con evals (prompts reales → llamada esperada).

### 3.2 Herramientas curadas (cobertura del backlog)

| Línea del backlog | Herramienta(s) | Tipo |
|---|---|---|
| Redactar y editar posts desde un chat | `draft_post`, `edit_post_section`, `get_post` (devuelve Markdown, no AST) | escritura |
| Open rate, CTR, revenue en lenguaje natural | `query_analytics` (semantic layer, §4.3) | lectura |
| Comparar decenas de posts en una petición | `compare_posts(post_ids \| filter, metrics)` → tabla con medianas y outliers | lectura |
| Historial completo de un suscriptor | `get_subscriber_history(email)` → timeline resumida + engagement score | lectura |
| Construir segmentos describiéndolos | `describe_segment(text)` → DSL + tamaño estimado; `create_segment` | escritura |
| Crear y editar automatizaciones | `draft_automation`, `edit_automation` (siempre sobre rama draft), `diff_automation`, `publish_automation` | escritura / destructiva |
| Imágenes IA a la media library | `generate_image(prompt, aspect)` → asset en R2 + `media_id` | escritura |
| Páginas, redirects y SEO | `list_pages`, `edit_page`, `create_redirect`, `audit_seo` | escritura |
| Leer y responder posts de comunidad y DMs | `list_community_activity`, `reply_community_post`, `list_dms`, `send_dm` | escritura |
| Ofertas y revenue de ads | `list_ad_opportunities`, `accept_ad`, `decline_ad`, `ad_revenue_report` | escritura |
| Podcasts | `list_shows`, `create_episode`, `schedule_episode`, `podcast_stats` | escritura |
| Productos, cupones y promo codes | `create_product`, `create_coupon`, `create_promo_code` | escritura |
| Informes de crecimiento y ganancias | `growth_report(period, by=source)`, `earnings_report(period, by=stream)` | lectura |
| A/B de asunto | `setup_subject_test(post_id, variants, sample_pct, metric)`, `suggest_subject_lines` | escritura |
| Entregabilidad por proveedor | `deliverability_by_provider(post_id)` → tabla + recomendaciones de [DELIVERABILITY.md](DELIVERABILITY.md) | lectura |
| Buscar en la documentación | `search_docs(query)` → fragmentos con URL (índice vectorial de docs.tirada.com) | lectura |
| Enviar | `send_post` | **destructiva, con confirmación** |

Ejemplo de respuesta compacta de `compare_posts`:

```text
32 posts (jul–oct 2026). Mediana: apertura verificada 41,2 %, CTR humano 3,1 %.
Top 3 por CTR: #128 "Guía de impuestos" 7,9 % · #135 "Hipotecas" 6,4 % · #119 "Cripto" 5,8 %
Bottom 3: #131 2,2 % · #126 1,9 % · #140 1,4 %  (los 3 enviados en sábado)
Patrón: posts con 1 CTA principal superan en +1,7 pp a los de 4+ enlaces.
```

### 3.3 Seguridad

1. **Permisos del rol**: el token OAuth hereda el rol del usuario (§5). Un contributor conectado desde Claude solo puede redactar; el tool `send_post` ni siquiera aparece en su lista.
2. **Clasificación de herramientas**: cada tool se anota `readOnlyHint` / `destructiveHint` (anotaciones MCP). Las destructivas (enviar, borrar, publicar automatización, cancelar suscripción, aceptar ad, cambiar precios) usan un **flujo de confirmación en dos pasos** que no depende de que el cliente MCP sea honesto:

```jsonc
// 1ª llamada: send_post({ post_id: "post_01JA4", audience: "lst_diario" })
{ "status": "confirmation_required",
  "summary": "Enviar 'Resumen semanal #142' a 184.302 suscriptores de 'Diario' ahora. Preflight: 0 errores, 1 aviso (2 imágenes sin alt).",
  "confirmation_token": "cfm_01JA7…",          // un solo uso, 10 min, ligado a este payload exacto
  "confirm_url": "https://app.tirada.com/confirm/cfm_01JA7…" }
// 2ª llamada: send_post({ ..., confirmation_token: "cfm_01JA7…" })
```

3. **Los envíos nunca salen sin confirmación explícita**. Para `send_post` y envíos de más de 1.000 destinatarios el token **no basta**: la confirmación se hace en `confirm_url` (dashboard en un ordenador, sesión humana con passkey o magic link). No hay app móvil del creador (principio 10 del [README](README.md)): en un móvil, `confirm_url` muestra *"Tirada se usa desde un ordenador"* y el botón para enviarse el enlace por email. Un modelo con prompt injection puede llegar como mucho a *pedir* el envío.
4. **Contenido no confiable**: posts de comunidad, DMs, respuestas de encuestas y webhooks entrantes se devuelven envueltos en `<untrusted_content>` y las herramientas de escritura tienen límites por sesión (p. ej. máximo 20 `send_dm` por hora).
5. **Audit log**: cada llamada registra `actor` (usuario), `via` (`mcp:claude.ai`, `mcp:chatgpt`, `agent`, `api_key:…`), tool, parámetros (con PII redactada), resultado y `request_id`. Visible en *Ajustes → Auditoría* y exportable.

---

## 4. Agente en el producto (Cmd+K / Cmd+J)

### 4.1 Superficies

- **Cmd+K**: paleta de comandos. Navegación, búsqueda global (posts, suscriptores, segmentos, ajustes) y acciones rápidas. Si la consulta no es un comando conocido, pasa al agente.
- **Cmd+J**: panel lateral del agente, consciente del contexto (post abierto, segmento seleccionado, informe visible).
- **En el editor**: el writer IA ([EDITOR.md](EDITOR.md)) usa el mismo motor: reescribir, acortar, cambiar tono, traducir, corregir ortografía y gramática **in place** como sugerencias aceptables, titulares y asuntos, outline a partir de los resultados de una encuesta ("qué escribir después").

### 4.2 Cómo funciona

Claude con tool use sobre **exactamente las mismas herramientas curadas del MCP** (§3.2), llamadas en nombre del usuario con su sesión y su rol. No hay una API privada para la IA. Reparto de modelos (igual que en [BUILD_VS_BUY.md](BUILD_VS_BUY.md), E1): **Claude (modelo grande)** para el agente y las tareas largas (redactar un post entero, auditar una automatización); **Claude (modelo medio)** para el escritor; **Claude (modelo pequeño)** para autocompletados y clasificación. Las confirmaciones destructivas se muestran como **tarjetas de acción** con botón: el agente propone, el humano pulsa.

### 4.3 Lenguaje natural → segmento y → analítica

El modelo **nunca** produce SQL ni toca ClickHouse. Produce JSON contra un esquema cerrado, que validamos y compilamos nosotros.

**NL → DSL de segmentos** (DSL definido en [PLATFORM.md](PLATFORM.md) §3.2):

> "Lectores de pago en España que no han abierto nada en 30 días pero clicaron en el post de hipotecas"

```json
{
  "name": "Pago en España, sin aperturas en 30 días, clicaron hipotecas",
  "match": "all",
  "conditions": [
    { "field": "subscription.tier", "op": "in", "value": ["pro", "founders"] },
    { "field": "location.country", "op": "eq", "value": "ES" },
    { "event": "post.opened_verified", "op": "count_eq", "value": 0, "within": "P30D" },
    { "event": "post.clicked_verified", "where": { "post_id": "post_01J8HP" }, "op": "count_gte", "value": 1 }
  ]
}
```

Misma forma que el ejemplo canónico de [PLATFORM.md](PLATFORM.md) §3.2 (`match` + `conditions`, nodos `field`/`event`/`segment`/`condition_set`).

El agente resuelve "el post de hipotecas" con `search_posts`, compila, muestra la traducción en lenguaje llano + **tamaño estimado** (sobre bitmaps) antes de guardar.

**NL → analítica**: una **semantic layer** con métricas y dimensiones declaradas (en YAML versionado), que compila a SQL parametrizado de ClickHouse con `workspace_id`/`publication_id` inyectados por el servidor:

```json
{ "metrics": ["verified_open_rate", "human_ctr", "attributed_revenue"],
  "dimensions": ["post.send_weekday"],
  "filters": [ { "dimension": "post.sent_at", "op": "between", "value": ["2026-07-01", "2026-09-30"] } ],
  "order_by": [ { "metric": "human_ctr", "dir": "desc" } ], "limit": 7 }
```

Ventajas: nada de inyección SQL, definiciones de métrica únicas (el "open rate" del agente es el mismo que el del dashboard), límites de coste por consulta, y el mismo endpoint `/analytics/query` para clientes de API.

### 4.4 Límites

Cuota de IA por plan (tokens/mes) con contador visible; prompt caching del contexto de publicación (estilo, plantillas, glosario); ningún dato de suscriptores sale a entrenamiento (contrato con proveedor sin retención); el agente cita las cifras con enlace al informe que las respalda.

---

## 5. Auth, equipos y roles

### 5.1 Modelo

```
Workspace (facturación, dominio de envío, miembros, API keys)
 ├── Publication A ── posts, suscriptores, website, comunidad, podcast
 ├── Publication B
 └── Publication C
Usuario ── Membership(workspace, rol) ── PublicationRole(pub, rol)?  (override opcional)
```

Un usuario puede estar en muchos workspaces. El rol de workspace aplica a todas sus publicaciones salvo que haya un **override por publicación** (p. ej. admin en el workspace de la agencia pero solo contributor en la publicación del cliente X; o sin acceso a una publicación concreta).

### 5.2 Matriz de permisos

| Permiso | Owner | Admin | Member | Contributor |
|---|:-:|:-:|:-:|:-:|
| Facturación y plan | ✔ | ✔ | – | – |
| Transferir/eliminar publicación | ✔ | – | – | – |
| Exportar suscriptores/segmentos | ✔ | ✔ | – | – |
| Integraciones, API keys, webhooks, apps MCP del workspace | ✔ | ✔ | – | – |
| Pagos (Stripe Connect, tiers, precios, payouts) | ✔ | ✔ | – | – |
| Dominios (envío y web), DNS, remitentes | ✔ | ✔ | – | – |
| Invitar y gestionar miembros | ✔ | ✔ | – | – |
| Enviar y programar posts | ✔ | ✔ | ✔ | – |
| Publicar automatizaciones | ✔ | ✔ | ✔ | – |
| Gestionar suscriptores y segmentos | ✔ | ✔ | ✔ | – |
| Website, SEO, redirects | ✔ | ✔ | ✔ | – |
| Ver analítica e ingresos | ✔ | ✔ | ✔ | Solo de sus posts |
| Aceptar ads y patrocinios | ✔ | ✔ | ✔ | – |
| Redactar posts y comentar en borradores | ✔ | ✔ | ✔ | ✔ |
| Redactar automatizaciones (rama draft) | ✔ | ✔ | ✔ | ✔ |
| Subir a media library / generar imágenes IA | ✔ | ✔ | ✔ | ✔ |

"Member = todo menos lo de admin" y "contributor = solo borradores" son literales del backlog. Owner es un admin único con las acciones irreversibles. Los permisos se implementan como **scopes** internamente; los roles son conjuntos de scopes, lo que permite **roles custom** en Enterprise sin tocar código, y hace que API keys, tokens MCP y agente compartan la misma comprobación.

### 5.3 Invitaciones, cambio de workspace y búsqueda

- **Invitación por email**: `POST /v1/workspace/invitations { email, role, publications? }`. Enlace de un solo uso, 7 días, ligado al email (si aceptas con otra cuenta, se pide verificación del email invitado). Reenviar y revocar.
- **Switcher**: Cmd+K → "Cambiar a…" con búsqueda difusa sobre todos tus workspaces y publicaciones; los recientes primero; agrupación por workspace con favoritos. Pensado para agencias y freelancers con 30+ publicaciones.
- **Bandeja unificada** opcional: borradores donde te piden revisión en cualquier workspace.

### 5.4 Autores

- `Author` es un objeto distinto del `User`: un usuario tiene un perfil de autor por publicación (bio, avatar, enlaces sociales, slug `/authors/lucia`), editable por él mismo.
- **Varios autores por post**, ordenados, con byline generado ("Por Lucía y Pedro") en email y web, y schema `Person` para SEO/Google News.
- **Guest authors**: perfiles sin cuenta (`gst_…`) para colaboradores puntuales; se pueden convertir en usuario más tarde enviando una invitación.

### 5.5 Comunidad

Mapeo por defecto (canónico en [PLATFORM.md](PLATFORM.md) §4.2), sobrescribible por canal: Owner/Admin → `community_admin`, Member → `community_manager`, Contributor → `moderator`. Se pueden nombrar **moderadores entre los lectores** sin darles acceso al dashboard. Los roles de Discord se sincronizan con tiers, no con roles de equipo ([PLATFORM.md](PLATFORM.md)).

### 5.6 Desprovisionamiento instantáneo

Al quitar a alguien (o bajarle de rol):

1. Se borran sus sesiones en Valkey y se publica `session.revoked` (todas las réplicas invalidan caché en <1 s); las conexiones Hocuspocus del editor se cierran.
2. Se revocan sus tokens OAuth (MCP y apps).
3. Sus **API keys** no se borran a ciegas (rompería integraciones): se **suspenden** y se notifica a los admins para reasignarlas o revocarlas en 7 días; con la opción "revocar todo ya" para salidas conflictivas.
4. Sus borradores y automatizaciones pasan al owner; los posts publicados conservan el byline.
5. Todo queda en el audit log.

**Enterprise**: **SCIM 2.0** (`/scim/v2/Users`, `/Groups`) para alta, baja y cambio de rol desde Okta/Entra/Google; grupos de IdP mapeados a roles por publicación. Desactivar en el IdP = paso 1–5 automático.

### 5.7 Transferencia de publicación con consentimiento escrito

Mover una publicación (suscriptores, contenido, Stripe, dominios) a otro workspace es la operación más peligrosa del sistema. Flujo:

1. El **owner** de origen inicia la transferencia indicando el email del owner de destino; reautenticación con passkey.
2. Se genera un **acuerdo de transferencia** (qué se mueve, qué no: historial de facturación queda; cuenta de Stripe Connect se desvincula y el destino conecta la suya; suscripciones de pago se migran o cancelan según lo elegido).
3. Ambos owners **firman** escribiendo su nombre completo y aceptando el texto; se guarda PDF con hash, IPs, timestamps.
4. **Periodo de espera de 72 h** con emails a todos los admins de origen y botón de cancelar.
5. Se ejecuta como workflow Temporal; eventos `publication.transfer.*` y entrada en el audit log de ambos workspaces.

### 5.8 Login del equipo

| Método | Detalle |
|---|---|
| **Magic link** | Un solo uso, 15 min, token de 256 bits guardado hasheado, nunca se consume con un `GET` (aterriza en una página que confirma con `POST`, por los escáneres de enlaces; ver [GROWTH_AND_MONETIZATION.md](GROWTH_AND_MONETIZATION.md) §4), comparación en tiempo constante, rate limit por email + IP. Abrir en el móvil un enlace pedido en el escritorio muestra un código de 6 dígitos/"aprobar" que **inicia sesión en el escritorio** que lo pidió (vínculo por `login_request_id`). |
| **Passkeys (WebAuthn)** | Recomendado por defecto tras el primer login; obligatorio para owners al hacer acciones de §5.7 y confirmaciones de envío por MCP. |
| **SSO** | SAML 2.0 y OIDC en Enterprise, con dominio verificado y opción "forzar SSO". |
| **2FA** | TOTP como alternativa para quien no use passkeys; los admins pueden exigirlo a todo el workspace. |

Es la misma pila de auth propia que sirve a los lectores ([README](README.md), decisión de Auth), con políticas más estrictas para el equipo: sesiones de 14 días con reautenticación para acciones sensibles (exportar, cambiar dominios, payouts, crear API keys).
