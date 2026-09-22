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
2. Variables → crear como **secretas**: `u/admin/anthropic_api_key`, y si hace
   falta `u/admin/github_read_token` y `u/admin/github_write_token`.
3. Importar el flow: `wmill sync push` con `flows/claude_run.built.yaml`, o
   crearlo a mano pegando cada `scripts/*.sh` en su paso.
4. **Marcar el flow como "same worker".** Sin eso `./shared` no existe y los
   pasos no se pasan el repo entre sí. Es el error número uno.
5. Disparar desde el formulario del flow.

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
