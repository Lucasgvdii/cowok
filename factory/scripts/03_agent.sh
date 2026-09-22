#!/usr/bin/env bash
# Paso 3 · el agente
#
# Esta es la única parte del flow donde corre un modelo, y es el paso más
# peligroso, así que es el más acotado:
#   - corre dentro de un contenedor con SOLO el repo montado en /work
#   - recibe SOLO ANTHROPIC_API_KEY. Sin token de git, sin nada más
#   - tiene timeout, tope de memoria y de CPU
#   - escribe con tu uid, así los pasos siguientes pueden leer lo que dejó
#
# Con USE_DOCKER=0 corre directo en el worker: más simple, sin aislamiento.
prompt="$1"
anthropic_api_key="$2"
permission_mode="${3:-acceptEdits}"

set -euo pipefail
SHARED="$(cd ./shared && pwd)"
DEST="$SHARED/repo"
OUT="$SHARED/agent.json"

USE_DOCKER="${USE_DOCKER:-1}"
RUNNER_IMAGE="${RUNNER_IMAGE:-factory-runner:1}"
TIMEOUT="${AGENT_TIMEOUT_SECONDS:-3600}"
MEM="${AGENT_MEMORY:-4g}"
CPUS="${AGENT_CPUS:-2}"

run_claude_in_docker() {
  docker run --rm \
    --user "$(id -u):$(id -g)" \
    --memory "$MEM" --cpus "$CPUS" \
    --pids-limit 512 \
    --security-opt no-new-privileges \
    -v "$DEST:/work" -w /work \
    -e ANTHROPIC_API_KEY="$anthropic_api_key" \
    -e HOME=/tmp \
    "$RUNNER_IMAGE" \
    timeout --signal=TERM --kill-after=30 "$TIMEOUT" \
      claude -p "$prompt" --permission-mode "$permission_mode" --output-format json
}

run_claude_local() {
  ( cd "$DEST" \
    && ANTHROPIC_API_KEY="$anthropic_api_key" \
       timeout --signal=TERM --kill-after=30 "$TIMEOUT" \
       claude -p "$prompt" --permission-mode "$permission_mode" --output-format json )
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
COST=$(jq -r '.total_cost_usd // .cost_usd // empty' "$OUT" 2>/dev/null || true)
TURNS=$(jq -r '.num_turns // empty' "$OUT" 2>/dev/null || true)
MS=$(jq -r '.duration_ms // empty' "$OUT" 2>/dev/null || true)
CHANGED=$(git -C "$DEST" status --porcelain | wc -l | tr -d ' ')

printf '{"mode":"%s","exit_code":%s,"cost_usd":%s,"turns":%s,"duration_ms":%s,"files_changed":%s,"raw":"%s"}\n' \
  "$MODE" "${CODE:-0}" "${COST:-null}" "${TURNS:-null}" "${MS:-null}" "$CHANGED" "$OUT"
