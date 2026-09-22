#!/usr/bin/env bash
# Paso 4 · gates
#
# Un gate es un comando que corre en el repo y termina con un código de salida.
# Nada más. Determinista, sin modelo. Si un gate no puede correr, eso NO es
# pass: se reporta como "error" y bloquea igual que un fallo.
#
# Entrada: JSON array. Ej:
#   [{"id":"typecheck","run":"pnpm typecheck"},
#    {"id":"test","run":"pnpm test"},
#    {"id":"lint","run":"pnpm lint"}]
#
# Salida: un resumen con el estado de cada gate. La v1 de esto emite SARIF por
# gate para que los hallazgos vuelvan tipados al agente. Todavía no.
gates_json="${1:-[]}"

set -euo pipefail
SHARED="$(cd ./shared && pwd)"
DEST="$SHARED/repo"
LOGS="$SHARED/gates"; mkdir -p "$LOGS"
cd "$DEST"

RESULTS="[]"
BLOCKING=0

COUNT=$(printf '%s' "$gates_json" | jq 'length')
for i in $(seq 0 $((COUNT-1))); do
  ID=$(printf '%s' "$gates_json"  | jq -r ".[$i].id")
  CMD=$(printf '%s' "$gates_json" | jq -r ".[$i].run")
  LOG="$LOGS/$ID.log"

  START=$(date +%s)
  # Subshell a propósito: aísla un `cd` del gate y evita que un `exit` dentro
  # del comando mate el paso entero.
  CODE=0
  ( eval "$CMD" ) >"$LOG" 2>&1 || CODE=$?
  # 126 y 127 significan "no se pudo ejecutar", que no es lo mismo que
  # "corrió y falló". Un gate que no corre nunca cuenta como pass.
  if   [ "$CODE" -eq 0 ];   then STATUS=pass
  elif [ "$CODE" -ge 126 ]; then STATUS=error
  else                           STATUS=fail
  fi
  END=$(date +%s)

  [ "$STATUS" = "pass" ] || BLOCKING=$((BLOCKING+1))

  TAIL=$(tail -c 4000 "$LOG" | jq -Rs .)
  RESULTS=$(printf '%s' "$RESULTS" | jq -c \
    --arg id "$ID" --arg st "$STATUS" --argjson code "$CODE" \
    --argjson secs "$((END-START))" --argjson tail "$TAIL" \
    '. + [{id:$id,status:$st,exit_code:$code,seconds:$secs,log_tail:$tail}]')

  printf '[gate] %-12s %s (exit %s, %ss)\n' "$ID" "$STATUS" "$CODE" "$((END-START))" >&2
done

printf '%s' "$RESULTS" | jq -c --argjson blocking "$BLOCKING" \
  '{gates: ., blocking: $blocking, passed: ($blocking == 0)}'
