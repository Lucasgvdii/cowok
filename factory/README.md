# Fábrica mínima · Windmill + agente

Lo más chico que convierte `claude --dangerously-skip-permissions` en algo con
historial, costo visible, triggers y pasos antes y después.

```
trigger (UI · webhook · cron)
  → clone → setup → agente → gates → artifact → [PR draft]
```

Windmill pone la UI, los triggers, el historial de runs y los secretos. Nosotros
ponemos los cinco pasos y la imagen donde corre el agente. Nada de esto se
adueña del grafo: los pasos son scripts de bash y los podés leer en 5 minutos.

## Arrancar

```bash
cp .env.example .env     # completá POSTGRES_PASSWORD
./bin/bootstrap.sh       # construye la imagen, levanta Windmill, espera
```

Después, una vez, en la UI de `http://localhost:8000`:

1. Crear el workspace `factory`.
2. Variables → crear **una sola**, secreta: `u/admin/claude_code_oauth_token`,
   con lo que imprime `claude setup-token`. Eso alcanza para arrancar contra un
   repo público. Los otros modos, API key en vez de suscripción y repo privado,
   son un cambio de dos líneas en el flow y están comentados ahí mismo.
3. Importar el flow: `wmill sync push` con `flows/claude_run.built.yaml`, o
   crearlo a mano pegando cada `scripts/*.sh` en su paso.
4. **Marcar el flow como "same worker".** Sin eso `./shared` no existe y los
   pasos no se pasan el repo entre sí. Es el error número uno.
5. Disparar desde el formulario del flow.

## Errores comunes al configurar

Los dos primeros no son de la fábrica: son de **Windmill AI**, el asistente del
editor, que es otra función y necesita su propia API key de Consola. Si no lo
vas a usar, dejalo apagado y ninguno de los dos aparece.

| Síntoma | Qué pasa | Qué hacer |
|---|---|---|
| El botón "test key" del recurso Anthropic falla | El recurso valida mandando `x-api-key`. Un token OAuth de suscripción no es una API key, así que lo rechazan. El botón funciona bien | Para la fábrica no hace falta ese recurso |
| `404 Not found: Could not find the resource u/admin/...` | Workspace settings apunta a una ruta de recurso que no existe. Windmill guarda la ruta como texto y no valida hasta usarla | Apagá Windmill AI, o creá el recurso con una API key real. Con el token de suscripción el 404 solo se convierte en 401 |
| El paso 3 falla al resolver sus entradas | Falta la variable del token | Es la única que el flow exige: `u/admin/claude_code_oauth_token` |
| El paso 2 no encuentra el repo | El flow no está marcado como *same worker*, así que `./shared` no existe | Marcalo en la configuración del flow |

La fábrica **no usa recursos ni AI providers**. Solo variables. Si estás peleando
con un recurso, estás en la pantalla equivocada.

## Los cinco pasos

| Paso | Qué hace | Credenciales que ve |
|---|---|---|
| `01_clone.sh` | Clona el repo en `./shared/repo` y borra el token del remote | token de lectura |
| `02_setup.sh` | Corre el comando de preparación, por defecto `pnpm install` | ninguna |
| `03_agent.sh` | Corre el agente **dentro de un contenedor** con solo `/work` montado | solo la clave del modelo |
| `04_gates.sh` | Corre cada gate en un subshell y reporta pass, fail o error | ninguna |
| `05_collect.sh` | Empaqueta el diff con su digest y su resumen | ninguna |
| `06_open_pr.sh` | Abre un PR **draft**, idempotente por rama. Apagado por defecto | token de escritura |

Tres decisiones que están en el código y conviene no deshacer:

- **El agente no ve credenciales de escritura.** El paso 3 le pasa una sola
  variable de entorno. No tiene token de git, y el remote quedó limpio en el
  paso 1. Aunque quisiera pushear, no puede.
- **Un gate que no puede correr no es un gate verde.** Salida 126 o 127 se
  reporta como `error` y cuenta como bloqueante, igual que un fallo.
- **Cada gate corre en subshell.** Un `cd` no contamina al siguiente y un
  `exit` no mata el paso. Esto fue un bug real, encontrado probándolo.

## Autenticación del modelo

Dos modos. Llenás una de las dos variables y el paso 3 elige solo.

| | Suscripción | API key |
|---|---|---|
| Variable | `u/admin/claude_code_oauth_token` | `u/admin/anthropic_api_key` |
| De dónde sale | `claude setup-token` en tu máquina, imprime el token y no lo guarda | Consola de Anthropic |
| Qué consume | Tu plan Pro, Max, Team o Enterprise | Facturación por token |
| Vence | Un año, y no hay renovación automática documentada | No vence |

**La trampa que cuesta una tarde.** `ANTHROPIC_API_KEY` tiene **más** precedencia
que `CLAUDE_CODE_OAUTH_TOKEN`, y en modo `-p` el CLI la usa siempre que esté
presente, sin avisar. Si dejás las dos seteadas creyendo que usás la
suscripción, te facturan por API igual. Por eso el paso 3 borra explícitamente
la variable del otro modo con `env -u` antes de invocar al CLI, y hay un test
que lo comprueba con el entorno del worker contaminado a propósito.

**El costo que reporta el paso deja de ser plata.** `total_cost_usd` lo calcula
el CLI localmente contra una tabla de precios de lista, y no depende de cómo te
autenticaste. Con suscripción vas a ver igual un número distinto de cero, pero
ese dinero no se factura. Por eso la salida del paso ahora trae `billing`, que
vale `subscription` o `api`: lo que consuma esos datos tiene que mirar ese campo
antes de sumar. Conviene que confirmes empíricamente qué devuelve tu versión del
CLI en el primer run.

**El riesgo operativo de la suscripción.** El consumo sale del mismo pool que tu
uso interactivo, con ventana rodante de 5 horas y ventana semanal. Una ráfaga de
runs de la fábrica puede agotarte la ventana y dejarte sin Claude en la terminal.
Con API key eso no pasa. Además el token queda atado a la persona que corrió
`claude setup-token`, así que para algo compartido por un equipo la API key es lo
correcto.

**Una incompatibilidad a futuro.** El flag `--bare` no lee
`CLAUDE_CODE_OAUTH_TOKEN`, y la documentación lo recomienda para CI. Si algún
día migramos a `--bare`, se pierde la opción de suscripción.

**Esto no sirve para Windmill AI.** El asistente de la UI que te escribe
scripts y flows es otra cosa, y necesita su propia credencial:

| Para qué | Credencial | Dónde va en Windmill |
|---|---|---|
| El paso 3, el gasto grande | Token OAuth de suscripción | **Variable** secreta `u/admin/claude_code_oauth_token` |
| Windmill AI, el asistente de la UI | API key de la Consola de Anthropic | **Resource** de Anthropic en AI providers |

Dos motivos por los que no se puede reusar el token en AI providers. Windmill
manda ese campo en el header `x-api-key`, que espera una key de Consola, y un
token OAuth es un bearer, así que la API lo rechaza. Y forzarlo con los headers
custom del resource es el patrón que Anthropic nombra explícitamente en su
página de legal y compliance: el OAuth es solo para uso de Claude Code y apps
nativas, y no se pueden almacenar ni intermediar credenciales de suscripción.
El paso 3 sí es una vía soportada porque invoca al CLI de Claude Code.

Ojo además con que en Windmill una **variable** y un **resource** son cosas
distintas. El flow referencia `variable('u/admin/claude_code_oauth_token')`: si
solo creaste un resource con ese nombre, el paso 3 no lo encuentra.

**Si lo que querías era que Claude te escriba los flows**, no hace falta
Windmill AI: usá la fábrica contra sí misma. Corré `claude-run` apuntado al
repo donde viven los yaml, con un prompt del estilo "agregá un flow que haga
X". Te devuelve el diff, lo revisás y lo importás. Esto sí usa tu suscripción,
porque invoca el binario de Claude Code, que es la superficie soportada para
ese token, y de paso estrenás la fábrica con un caso real.

La diferencia de fondo entre las dos cosas: **ejecutar el binario** de Claude
Code con el token es el uso documentado y encaja en la salvedad del texto legal
sobre el binario sin modificar. **Llamar a la Messages API** con ese mismo token
desde otra aplicación no lo es, y además ni siquiera autentica.

## Aislamiento del agente

Por defecto `USE_DOCKER=1` y el paso 3 corre en la imagen de `runner/`, con solo
el repo montado, con tope de memoria, de CPU y timeout, sin privilegios nuevos
y con tu uid para que los archivos vuelvan legibles.

Para que eso funcione el worker tiene el socket de Docker montado, y eso **le da
acceso equivalente a root sobre el host**. Es aceptable en un server dedicado a
la fábrica; no lo es en una máquina compartida. Si preferís evitarlo, poné
`USE_DOCKER=0`: el agente corre directo en el worker, más simple y sin
aislamiento. La alternativa buena, worker groups, es una función de pago de
Windmill.

**Pendiente de evaluar: Windmill trae un sandbox de agente nativo.** El worker
de esta instancia ya tiene `nsjail`, `node` y `bun`, así que la maquinaria está
disponible incluso en la edición comunitaria. Si ese sandbox aísla filesystem y
procesos por sí solo, **el socket de Docker sobra** y eso es la mejora más
valiosa disponible. Antes de migrar hay que confirmar dos cosas contra la UI:
si expone topes de memoria, CPU y procesos, porque el `docker run` de acá sí los
pone, y si se puede combinar con invocar el binario y la variable de OAuth, ya
que la plantilla nativa viene cableada a API key.

**La trampa al migrar:** el directorio compartido entre pasos y un volumen
persistente **no son lo mismo**. `./shared` con `same_worker` pasa el repo de un
paso al siguiente dentro de **una** corrida. Un volumen persiste **entre**
corridas. Cambiar uno por otro rompe la cadena clone, setup, agente, gates.

**Y la reanudación de sesión no es un objetivo.** El agente arranca en frío a
propósito: el diseño dice que cada intento recibe hallazgos tipados, no
historial de conversación. Reanudar la sesión entre intentos devuelve por la
ventana lo que se sacó por la puerta. Sirve para recuperarse de un corte a mitad
de un intento, no para encadenarlos.

## Versionar los flows

El git sync automático de Windmill es de pago. `bin/export-to-git.sh` hace lo
mismo por afuera: baja el workspace con la CLI y lo commitea. Ponelo en un cron
y tenés historial sin licencia.

## Editar los pasos

Los scripts viven en `scripts/` para poder probarlos con `bash -n` y shellcheck.
Windmill los quiere embebidos en el flow. `bin/build-flow.py` une las dos cosas:

```bash
vim scripts/04_gates.sh
python3 bin/build-flow.py      # regenera flows/claude_run.built.yaml
```

## Qué está probado y qué no

| | Estado |
|---|---|
| `04_gates.sh`, `05_collect.sh` | Probados contra un repo de prueba, incluidos los casos de fallo, de comando inexistente y de `cd` sucio |
| Elección de credencial en `03_agent.sh` | Probada con un CLI simulado: con el entorno del worker contaminado, el modo suscripción recibe solo el token y el modo API key recibe solo la clave. Sin credencial, sale con código 2 |
| `bin/build-flow.py` | Probado, genera el flow y valida que cada paso tenga su script |
| Los `.sh` restantes | Sintaxis verificada. No ejecutados: necesitan red, Docker o un repo real |
| `docker-compose.yml`, `runner/Dockerfile` | Escritos, no levantados en este entorno |
| `flows/claude_run.flow.yaml` | Escrito contra la documentación de Windmill, **no verificado contra una instancia**. Si `wmill sync push` se queja, creá el flow a mano y pegá los scripts: eso siempre funciona |

## Lo que sigue, en orden

1. **El loop.** Hoy es lineal: si los gates fallan, el run termina en rojo. El
   paso siguiente es encerrar agente y gates en un while con tope de intentos,
   de dinero y de tiempo, y reinyectar los hallazgos. Es el corazón de la
   fábrica y lo único que ningún CI te da.
2. **Hallazgos tipados.** Que cada gate emita SARIF en vez de un log. Semgrep y
   ESLint ya lo emiten, así que salen gratis, y `tsc` y `vitest` necesitan un
   parser. Con eso el agente recibe correcciones ubicadas en vez de texto.
3. **Aprobación humana.** Un paso suspendido antes del PR.
4. **Costo acumulado y tope duro.** Hoy el paso 3 reporta el costo del run. El
   tope real se pone con un proxy que emita una clave por run.
