#!/usr/bin/env bash
# Paso 3 · el agente
#
# Esta es la única parte del flow donde corre un modelo, y es el paso más
# peligroso, así que es el más acotado:
#   - corre dentro de un contenedor con SOLO el repo montado en /work
#   - recibe SOLO la credencial del modelo. Sin token de git, sin nada más
#   - tiene timeout, tope de memoria y de CPU
#   - escribe con tu uid, así los pasos siguientes pueden leer lo que dejó
#
# Con USE_DOCKER=0 corre directo en el worker: más simple, sin aislamiento.
#
# ── Autenticación ────────────────────────────────────────────────────────────
# Dos modos, elegís uno llenando una de las dos variables:
#
#   oauth    CLAUDE_CODE_OAUTH_TOKEN, sale de `claude setup-token`.
#            Consume tu suscripción (Pro, Max, Team o Enterprise).
#   api_key  ANTHROPIC_API_KEY. Consume facturación por token de la API.
#
# GOTCHA QUE CUESTA UNA TARDE: ANTHROPIC_API_KEY tiene MÁS precedencia que
# CLAUDE_CODE_OAUTH_TOKEN, y en modo -p se usa siempre que esté presente, sin
# avisar. O sea: si dejás las dos seteadas, el token OAuth se ignora y te
# facturan por API creyendo que estás usando la suscripción. Por eso cada modo
# acá borra explícitamente la variable del otro con `env -u`.
#
# Otra: `--bare` NO lee CLAUDE_CODE_OAUTH_TOKEN. La doc recomienda --bare para
# CI, así que si algún día migrás a ese flag, perdés la opción de suscripción.
prompt="$1"
oauth_token="${2:-}"
api_key="${3:-}"
permission_mode="${4:-acceptEdits}"

set -euo pipefail
SHARED="$(cd ./shared && pwd)"
DEST="$SHARED/repo"
OUT="$SHARED/agent.json"

USE_DOCKER="${USE_DOCKER:-1}"
RUNNER_IMAGE="${RUNNER_IMAGE:-factory-runner:1}"
TIMEOUT="${AGENT_TIMEOUT_SECONDS:-3600}"
MEM="${AGENT_MEMORY:-4g}"
CPUS="${AGENT_CPUS:-2}"

# El token OAuth gana si está, porque es lo que pediste explícitamente.
if   [ -n "$oauth_token" ]; then AUTH=oauth;   BILLING=subscription
elif [ -n "$api_key" ];     then AUTH=api_key; BILLING=api
else
  echo "falta credencial: pasá CLAUDE_CODE_OAUTH_TOKEN o ANTHROPIC_API_KEY" >&2
  exit 2
fi

run_claude_in_docker() {
  # Un contenedor no hereda el entorno del host: solo ve los -e que le pasamos.
  # Por eso no hace falta unset acá, alcanza con no pasar la otra variable.
  local auth_env=()
  if [ "$AUTH" = "oauth" ]; then
    auth_env=(-e "CLAUDE_CODE_OAUTH_TOKEN=$oauth_token")
  else
    auth_env=(-e "ANTHROPIC_API_KEY=$api_key")
  fi

  docker run --rm \
    --user "$(id -u):$(id -g)" \
    --memory "$MEM" --cpus "$CPUS" \
    --pids-limit 512 \
    --security-opt no-new-privileges \
    -v "$DEST:/work" -w /work \
    "${auth_env[@]}" \
    -e HOME=/tmp \
    "$RUNNER_IMAGE" \
    timeout --signal=TERM --kill-after=30 "$TIMEOUT" \
      claude -p "$prompt" --permission-mode "$permission_mode" --output-format json
}

run_claude_local() {
  # Acá SÍ hace falta el unset: el worker puede tener la otra variable seteada
  # en su propio entorno y ganaría por precedencia.
  if [ "$AUTH" = "oauth" ]; then
    ( cd "$DEST" \
      && env -u ANTHROPIC_API_KEY "CLAUDE_CODE_OAUTH_TOKEN=$oauth_token" \
         timeout --signal=TERM --kill-after=30 "$TIMEOUT" \
         claude -p "$prompt" --permission-mode "$permission_mode" --output-format json )
  else
    ( cd "$DEST" \
      && env -u CLAUDE_CODE_OAUTH_TOKEN "ANTHROPIC_API_KEY=$api_key" \
         timeout --signal=TERM --kill-after=30 "$TIMEOUT" \
         claude -p "$prompt" --permission-mode "$permission_mode" --output-format json )
  fi
}

CODE=0
if [ "$USE_DOCKER" = "1" ] && [ -S /var/run/docker.sock ]; then
  MODE=docker; run_claude_in_docker >"$OUT" 2>"$SHARED/agent.log" || CODE=$?
else
  MODE=local;  run_claude_local     >"$OUT" 2>"$SHARED/agent.log" || CODE=$?
fi

tail -n 30 "$SHARED/agent.log" >&2 || true

# El CLI devuelve JSON con uso y costo. Si el formato cambia, no rompemos el
# paso: cada campo cae a null por separado.
#
# OJO con cost_usd: es un estimado que el CLI calcula localmente contra una
# tabla de precios de lista, y NO depende del método de autenticación. Con
# suscripción vas a ver igual un número distinto de cero, pero ese dinero no
# se factura: tu consumo sale del plan. Por eso va `billing` al lado, para que
# lo de abajo sepa cómo leer el número y no sume plata que nadie pagó.
COST=$(jq -r '.total_cost_usd // .cost_usd // empty' "$OUT" 2>/dev/null || true)
TURNS=$(jq -r '.num_turns // empty' "$OUT" 2>/dev/null || true)
MS=$(jq -r '.duration_ms // empty' "$OUT" 2>/dev/null || true)
CHANGED=$(git -C "$DEST" status --porcelain | wc -l | tr -d ' ')

printf '{"mode":"%s","auth":"%s","billing":"%s","exit_code":%s,"cost_usd":%s,"turns":%s,"duration_ms":%s,"files_changed":%s,"raw":"%s"}\n' \
  "$MODE" "$AUTH" "$BILLING" "${CODE:-0}" "${COST:-null}" "${TURNS:-null}" "${MS:-null}" "$CHANGED" "$OUT"
