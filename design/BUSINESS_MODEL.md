# Modelo de negocio de Tirada

> **Este documento sustituye a [GROWTH_AND_MONETIZATION.md §13](GROWTH_AND_MONETIZATION.md#13-modelo-de-negocio-de-tirada)** (precio por suscriptores activos, plan gratuito hasta 2.500). Lo que diga ese apartado sobre planes y precios queda obsoleto; lo que diga aquí manda.

Recoge las decisiones tomadas con el founder sobre posicionamiento, precios, soporte, extras y números. Todas las cifras de coste propio son **estimaciones**; todos los precios de terceros (beehiiv, Substack, Mailchimp, AWS SES, Stripe, Cloudflare, Whapi, WhatsApp) salieron de memoria o de webs de terceros y están marcados **(a verificar)** hasta comprobarlos en la fuente oficial.

---

## 1. Contexto y restricción principal

El [ROADMAP](ROADMAP.md) describe la versión "con ronda" (65 personas, ~20 M USD). La realidad de partida es otra: **un founder en solitario, con agentes de IA y sin capital**. De ahí sale la regla que ordena todo lo demás:

> **Los costes tienen que escalar con los ingresos. Ningún cliente puede costarnos dinero, ni el día uno ni con 100.000 suscriptores.**

Consecuencias directas:

- Envío inicial sobre **Amazon SES** (coste por email, sin compromiso), no sobre el MTA propio de [DELIVERABILITY.md](DELIVERABILITY.md). El MTA propio con KumoMTA queda como palanca de margen para cuando el volumen lo pague.
- El soporte humano es el coste más caro y menos escalable (horas del founder), así que **es lo que diferencia los planes**.
- Nada de "gratis ilimitado" financiado con una ronda que no existe.

## 2. Posicionamiento

**La plataforma de newsletters seria más barata que no pierde dinero.**

- **0 % de comisión sobre las ventas del creador, siempre** (suscripciones, productos, entradas, patrocinios), en todos los planes.
- Lema: **"Tu newsletter, tu dominio, tu audiencia"**. El dominio es del creador, la lista se exporta entera y el cobro va a su cuenta de Stripe.

| Competidor | Cómo cobra | Ejemplo con 10.000 suscriptores |
|---|---|---|
| Substack | 10 % de los ingresos de pago (+ Stripe) | 1.000 de pago a 7 $/mes → ~700 $/mes para Substack (a verificar) |
| beehiiv | Cuota por tamaño de lista | ~139 $/mes en el plan Lite desde octubre de 2026, según fuentes de terceros (a verificar) |
| Mailchimp | Cuota por contactos | ~100 $/mes por 10.000 contactos (sin verificar) |
| **Tirada** | Cuota base + volumen enviado | **10,50–20,70 €/mes** con envío semanal (§4.3) |

## 3. Por qué cobrar por volumen de envío

Se cobra por **emails enviados**, no por tamaño de lista ni por % de ingresos.

1. **El coste escala con los emails enviados.** SES cobra por email; el precio sigue al coste y el margen se mantiene positivo a cualquier escala.
2. **Nunca perdemos dinero.** Un cliente que envía mucho paga mucho; uno que envía poco nos cuesta poco.
3. **No penaliza a los suscriptores que no leen.** Tener 20.000 en la lista y enviar a 8.000 activos cuesta lo de 8.000.
4. **Limpiar inactivos abarata la factura.** El incentivo económico del creador coincide con la entregabilidad (sunset policy, principio 5 del [README](README.md)): menos envíos a quien no abre, mejor reputación, factura más baja.

### 3.1 Cómo se ve en el producto

- **Calculadora de precio en la UI**: en la web pública y en el dashboard. El creador mete suscriptores y frecuencia y ve el precio mensual de cada plan. En el dashboard, previsión del mes en curso con el ritmo de envíos real.
- **Tramos de precio fijo opcionales**: quien prefiera una factura predecible elige un tramo (p. ej. hasta 25.000, 50.000 o 100.000 emails/mes) y paga un importe fijo. **Avisos antes de cruzar** el tramo (al 80 % y al 100 %) y opción de subir de tramo o pagar el exceso a la tarifa por cada 10.000.

  Ejemplo de tramos (precio = base + tramo completo a la tarifa por cada 10.000; estimación, sin descuento por tramo):

  | Tramo (emails/mes) | Plan 1 | Plan 2 | Plan 3 |
  |---|---|---|---|
  | hasta 25.000 | 7,75 € | 12 € | 17 € |
  | hasta 50.000 | 11,50 € | 17 € | 22 € |
  | hasta 100.000 | 19 € | 27 € | 32 € |
  | hasta 250.000 | 41,50 € | 57 € | 62 € |

- **Tope de gasto**: el creador fija un máximo mensual. Un envío que lo superaría **no sale sin confirmación explícita**, nunca se corta a mitad de envío.
- **Precio estimado antes de cada envío grande**: "Este envío son 12.400 emails ≈ 1,86 €".

## 4. Planes

Las tres opciones tienen **el mismo producto**; lo que cambia es el **nivel de soporte**.

| Plan | Base | Por cada 10.000 emails | Soporte incluido |
|---|---|---|---|
| **1. Sin soporte** | 4 €/mes | 1,50 € | Documentación + **MCP** para que el creador use su propia IA (Claude, ChatGPT) con herramientas de diagnóstico (estado de envíos, rebotes, DNS, reputación) |
| **2. Soporte con IA** | 7 €/mes | 2 € | Todo lo anterior + **asistente de IA integrado** de Tirada (los tokens los pagamos nosotros, ~1 €/mes por cliente, estimación) |
| **3. Soporte normal** | 12 €/mes | 2 € | Todo lo anterior + **tickets humanos incluidos** |

- **Facturación anual: 2 meses gratis** (se paga 10 de 12).
- **Plan gratuito pequeño**: hasta ~500 suscriptores, **con tarjeta obligatoria** como filtro antiabuso (no se cobra nada). Sin soporte humano incluido: tickets de pago como en el plan 1. Nos cuesta céntimos (~2.200 emails/mes ≈ 0,20 € de SES, estimación).
- **Posible plan "Acompañado" (~39 €/mes)** con soporte prioritario y revisiones periódicas: **solo si aparece demanda real**, no en el lanzamiento.
- Precios sin IVA en todos los cálculos de este documento (tratamiento fiscal por país pendiente).

### 4.1 Ejemplo trabajado: 10.000 suscriptores, envío semanal

10.000 × 4,33 envíos/mes ≈ **43.300 emails/mes** (4,33 tramos de 10.000).

| | Plan 1 | Plan 2 | Plan 3 |
|---|---|---|---|
| Precio mensual | 4 + 4,33 × 1,50 ≈ **10,50 €** | 7 + 4,33 × 2 ≈ **15,70 €** | 12 + 4,33 × 2 ≈ **20,70 €** |
| Precio anual equivalente | **≈ 8,75 €/mes** | **≈ 13 €/mes** | **≈ 17,20 €/mes** |

Coste propio estimado para ese cliente: **≈ 5 €/mes** = SES ~4 € (0,10 $ por 1.000 emails, a verificar) + ~0,50 € de cuota de servidor + ~0,50 € de comisión de Stripe por cobrar la cuota. En el plan 2 se suma ~1 € de IA. **Márgenes de ~50–65 %.**

> **Corrección de un error anterior.** En la conversación se dijo "1 € por 10k emails = 7 veces el coste". Es falso: SES cuesta **~1 $ por cada 10.000 emails** (≈ 0,93 €), no ~0,14 €. Cobrar 1,50–2 € por cada 10.000 deja un margen variable del 38–53 %, no de 7x. Todos los números de este documento usan ya la cifra corregida.

### 4.2 Tabla por tamaño (envío semanal)

Supuestos (estimaciones): SES 0,93 € por cada 10.000 emails; servidor 0,50 €/mes hasta 10k suscriptores y 1 €/mes a 50k; Stripe 1,5 % + 0,25 € por cobro (tarjeta UE, a verificar); IA del plan 2 1 €/mes; **reserva de soporte humano del plan 3 2,50 €/mes** (≈ 5 minutos de founder al mes a 30 €/h, de media entre clientes).

| Suscriptores | Emails/mes | Plan | Precio/mes | Coste/mes | Margen/mes | Margen % |
|---|---|---|---|---|---|---|
| 1.000 | 4.330 | 1 | 4,65 € | 1,22 € | 3,43 € | 74 % |
| 1.000 | 4.330 | 2 | 7,87 € | 2,27 € | 5,60 € | 71 % |
| 1.000 | 4.330 | 3 | 12,87 € | 3,84 € | 9,03 € | 70 % |
| 10.000 | 43.300 | 1 | 10,50 € | 4,94 € | 5,56 € | 53 % |
| 10.000 | 43.300 | 2 | 15,66 € | 6,01 € | 9,65 € | 62 % |
| 10.000 | 43.300 | 3 | 20,66 € | 7,59 € | 13,07 € | 63 % |
| 50.000 | 216.500 | 1 | 36,48 € | 21,93 € | 14,55 € | 40 % |
| 50.000 | 216.500 | 2 | 50,30 € | 23,13 € | 27,17 € | 54 % |
| 50.000 | 216.500 | 3 | 55,30 € | 24,71 € | 30,59 € | 55 % |

Lectura:

- **La cuota base es la que da margen en listas pequeñas**; el tramo por volumen solo cubre SES con un 38 % (plan 1) o 53 % (planes 2 y 3) de margen.
- En listas grandes el margen tiende al del tramo variable. El plan 1 a 50k (40 %) es el punto más flojo: aceptable, pero vigilar.
- **Objetivo de margen bruto combinado: 60–75 %.** Se alcanza con la mezcla esperada (muchas listas de 1k–10k, pocas grandes) y mejora si se pasa al MTA propio cuando el volumen lo justifique.
- Las cuentas anuales tienen menos margen por mes (10/12 del precio, y en los planes 2 y 3 el dominio incluido, §6.1), compensado por cobro adelantado y menos churn.

## 5. Política de soporte

### 5.1 Regla general

> **Si quiere ayuda humana sin pagar tickets, que pague el plan 3.**

En los planes 1, 2 y gratuito, **cualquier ayuda humana es un ticket de pago, incluidos los problemas críticos**:

- **15 € por ticket resuelto**, tarifa plana (no por volumen): un ticket cuesta tiempo del founder igual con 500 que con 50.000 suscriptores. Razonamiento: 15–30 minutos a ~30 €/h.
- **Solo se cobra si se resuelve.**
- **Bono de 3 tickets por 35 €**, válido 6 meses.
- **Antes de abrir el ticket**, la UI ofrece dos alternativas: (1) probar con la IA (asistente integrado o el MCP con su propia IA), que puede resolverlo gratis; (2) **pasar al plan 3 ese mes**, que incluye tickets y a menudo sale más a cuenta.

### 5.2 Si la culpa es de Tirada, se devuelve

El ticket se reembolsa si el problema fue culpa nuestra, **automáticamente cuando el diagnóstico lo confirma**. Definición por escrito (en los términos del servicio):

| Culpa de Tirada (se reembolsa) | No es culpa de Tirada (se cobra) |
|---|---|
| Bugs de Tirada | Reputación de la lista del creador (listas compradas, quejas, inactivos) |
| Caídas de nuestra infraestructura | DNS que el creador configuró mal o cambió |
| Envíos que no salieron por error nuestro | Retenciones de Stripe por su KYC o verificación |
| Facturación incorrecta | Contenido bloqueado por filtros por su contenido o enlaces |
| | Integraciones de terceros que el creador configuró |

### 5.3 Lo que no es soporte y nunca se cobra

- **Incidencias de plataforma que son nuestras**: página de estado automática y proactiva + email a todos los clientes afectados. Nadie tiene que abrir un ticket para enterarse de que algo nuestro falla.
- **Obligaciones legales**: solicitudes RGPD de los lectores, notificación de brechas en 72 h a la AEPD y a los afectados, retirada de abuso/phishing y avisos de copyright.

### 5.4 Prevenir antes que atender

La mayoría de los problemas críticos se evitan en el producto y los atienden **agentes de operaciones**; el founder se reserva las decisiones legales o irreversibles.

- Confirmaciones antes de envíos grandes y **ventana para deshacer** un envío.
- **Límites para remitentes nuevos** (volumen creciente, como el pool "en prueba" de [DELIVERABILITY.md](DELIVERABILITY.md)).
- **Pausa automática si las quejas superan el 0,1 %.**
- Backups y exportación siempre disponibles.
- Herramientas de diagnóstico en el MCP y en el asistente: "¿por qué no llegó este email?", "¿está bien mi DNS?".

## 6. Extras

### 6.1 Dominio propio

Lo que aporta valor es la **configuración automática**, no regalar el dominio.

| Opción | Para quién | Precio |
|---|---|---|
| **Trae tu dominio y lo configuramos solos**: web, envío (SPF, DKIM, DMARC) y reenvío de correo con Cloudflare Email Routing | Todos los planes | Gratis |
| **Compra tu dominio desde Tirada** (.com, .es y similares) | Quien no tenga dominio | A coste del registrador revendedor (~11–15 $/año, a verificar) + ~5 €/año |
| **Dominio incluido** | Solo plan anual de los planes 2 y 3 | Promoción; el margen de esos planes lo aguanta |

- **Por qué no regalarlo a todos:** ~1 €/mes por dominio se come cerca de un tercio del margen de un cliente pequeño del plan 1 (~3 € de margen a 1.000 suscriptores), y muchos creadores ya tienen dominio.
- **Registro:** hace falta un registrador que permita registrar dominios para terceros (revendedor). Cloudflare Registrar, por lo que sabemos, solo registra en la propia cuenta (a verificar).
- **El dominio es del creador:** se registra a su nombre y se puede llevar a otro registrador cuando quiera. Los TLD premium (.io, .ai, etc.) se cobran aparte, a coste.

### 6.2 Servicios puntuales

| Servicio | Precio |
|---|---|
| Migración hecha por nosotros | 49 € |
| Revisión de entregabilidad | 29 € |
| Configuración manual de dominio (cuando el asistente automático no basta, p. ej. DNS en proveedores raros) | 19 € |

### 6.3 Canales

- **Telegram**: incluido (la API de bots es gratis para nosotros).
- **Publicación en Canales de WhatsApp** mediante API no oficial: opcional y **bajo el riesgo del propio creador** (número dedicado, posible bloqueo por Meta). Si no se autoaloja, pequeño add-on para cubrir Whapi (~30–50 $/mes, a verificar).
- **API oficial de WhatsApp para newsletters: no se ofrece.** ~0,04–0,07 $ por mensaje de marketing (a verificar) → **~1.700–3.000 $/mes** para 10.000 suscriptores semanales, frente a **~4 $** por email.

### 6.4 IA (audio, imágenes)

Cupo incluido en cada plan; el exceso se cobra al coste de los tokens más margen, con el mismo sistema de avisos y tope de gasto que el envío.

## 7. Economía unitaria y punto de equilibrio

Estimaciones, al arranque:

- **Costes fijos ~150 €/mes** (infraestructura base + herramientas).
- Margen medio por cliente **~5–6 €/mes**.
- **~30 clientes** cubren los fijos.
- **~400–500 clientes** pagan además un sueldo de ~2.500 €/mes al founder ((2.500 + 150) / 5,5 ≈ 480).

**Stripe Connect: Standard, no Express.** Express cuesta ~2 $ por cuenta activa al mes más comisión por payout (a verificar); con miles de creadores pequeños eso se come el margen de los planes baratos. Con **Standard** el creador es el merchant, Stripe le cobra directamente a él y a nosotros no nos cuesta nada por cuenta. Encaja con el 0 % y con "tu audiencia, tu cuenta".

La ad network y las recomendaciones de pago de [GROWTH_AND_MONETIZATION.md](GROWTH_AND_MONETIZATION.md) (§7, §8) **no entran en estos números**: su modelo de ingresos queda pendiente de revisar y el negocio tiene que funcionar sin ellas.

## 8. Lo que no haremos

- **No** cobrar un % de comisión sobre las ventas del creador, ni "solo en el plan gratuito", ni "temporalmente".
- **No** mezclar cuota + %.
- **No** ofrecer un plan gratuito ilimitado.
- **No** enviar newsletters completos por la API oficial de WhatsApp.
- **No** regalar soporte humano en los planes baratos: el plan 3 existe para eso.

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| **Suspensión de la cuenta de SES** (un cliente malo dispara rebotes o quejas y AWS suspende toda la cuenta) | Pausa automática de quejas al 0,1 % (por debajo de los umbrales de AWS); límites para remitentes nuevos; validación de listas al importar; tarjeta obligatoria incluso en el plan gratuito; configuration sets por cliente para aislar métricas; relay de respaldo contratado (p. ej. Postmark) para emails transaccionales; plan B documentado con un segundo proveedor y, a medio plazo, MTA propio. |
| **Percepción de factura variable** ("no sé cuánto voy a pagar") | Calculadora pública, previsión en el dashboard, tramos de precio fijo opcionales, avisos antes de cruzar y tope de gasto con confirmación. |
| **Abuso del soporte** (tickets de pago disputados, "esto es culpa vuestra") | Definición escrita de "culpa de Tirada"; diagnóstico automático que decide el reembolso; cobro solo si se resuelve; IA y MCP como primer filtro. |
| **El plan barato genera tickets** y consume el tiempo del founder | Tickets de pago en planes 1 y 2; oferta de subir al plan 3 antes de abrir uno; prevención en producto (§5.4); documentación y diagnósticos que la IA del creador puede usar. Si aun así no basta, subir la cuota base del plan 1 antes que regalar horas. |
| **Precios de terceros desactualizados** (SES, Stripe, beehiiv, WhatsApp) | Verificar todas las cifras marcadas "a verificar" antes de publicar la página de precios; revisar márgenes cada trimestre. |
