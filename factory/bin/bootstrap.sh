#!/usr/bin/env bash
# Deja la fábrica lista para el primer run.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { cp .env.example .env; echo "creado .env — completalo y volvé a correr"; exit 1; }
# shellcheck disable=SC1091
set -a; . ./.env; set +a

echo "1/3 construyendo la imagen del runner..."
docker build -t "${RUNNER_IMAGE:-factory-runner:1}" runner/

echo "2/3 levantando Windmill..."
docker compose up -d

echo "3/3 esperando a que el servidor responda..."
for i in $(seq 1 60); do
  if curl -fsS "${BASE_URL:-http://localhost:8000}/api/version" >/dev/null 2>&1; then
    echo "listo: ${BASE_URL:-http://localhost:8000}"
    cat <<'MSG'

Siguiente, a mano en la UI (una vez):
  1. Entrar y crear el workspace "factory".
  2. Variables → crear estas como SECRETAS:
       u/admin/anthropic_api_key
       u/admin/github_read_token     (opcional, para repos privados)
       u/admin/github_write_token    (solo si vas a abrir PRs)
  3. Crear el flow "claude-run" con los 5 pasos de scripts/*.sh,
     o importar flows/claude_run.flow.yaml con `wmill sync push`.
  4. Marcar el flow como "same worker" para que ./shared funcione.
  5. Disparar desde el formulario del flow.
MSG
    exit 0
  fi
  sleep 2
done
echo "el servidor no respondió a tiempo; mirá: docker compose logs server" >&2
exit 1
