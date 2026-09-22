#!/usr/bin/env bash
# Versionado a git, a mano.
#
# En Windmill el git sync automático es una función de pago. Esto hace lo mismo
# por afuera: baja el workspace con la CLI y lo commitea. Ponelo en un cron y
# tenés historial de quién cambió qué flow, sin licencia.
#
# Requiere: npm i -g windmill-cli   (comando `wmill`)
set -euo pipefail

WORKSPACE="${WM_WORKSPACE:-factory}"
REMOTE="${WM_REMOTE:-http://localhost:8000}"
TARGET="${1:-./workspace}"

command -v wmill >/dev/null || { echo "falta la CLI: npm i -g windmill-cli" >&2; exit 1; }

mkdir -p "$TARGET"
cd "$TARGET"
[ -d .git ] || git init -q .

# Ajustá los nombres de subcomando si tu versión de la CLI difiere.
wmill workspace add "$WORKSPACE" "$WORKSPACE" "$REMOTE" 2>/dev/null || true
wmill sync pull --yes

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "wmill sync $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "commiteado"
  [ -n "${WM_GIT_PUSH:-}" ] && git push || true
else
  echo "sin cambios"
fi
