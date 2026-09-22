#!/usr/bin/env bash
# Paso 2 · setup del entorno (instalar dependencias, generar lo que haga falta)
setup_cmd="${1:-pnpm install --frozen-lockfile}"

set -euo pipefail
DEST="$(cd ./shared/repo && pwd)"
cd "$DEST"

START=$(date +%s)
if eval "$setup_cmd" >"../setup.log" 2>&1; then STATUS=ok; CODE=0
else CODE=$?; STATUS=fail; fi
END=$(date +%s)

tail -n 40 ../setup.log >&2 || true
printf '{"status":"%s","exit_code":%s,"seconds":%s,"cmd":%s}\n' \
  "$STATUS" "$CODE" "$((END-START))" "$(printf '%s' "$setup_cmd" | jq -R .)"
