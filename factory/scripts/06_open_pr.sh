#!/usr/bin/env bash
# Paso 6 · aplicar, en modo borrador
#
# Este es el ÚNICO paso con credencial de escritura. Abre un PR en draft.
# Nunca mergea. Es idempotente: si la rama ya tiene PR, devuelve ese.
repo="$1"
base_branch="${2:-main}"
title="$3"
github_write_token="$4"
run_id="${5:-local}"

set -euo pipefail
SHARED="$(cd ./shared && pwd)"
DEST="$SHARED/repo"
BRANCH="factory/${run_id}"
cd "$DEST"

if [ ! -s "$SHARED/patch.diff" ]; then
  printf '{"status":"skipped","reason":"sin cambios"}\n'; exit 0
fi

git config user.email "factory@local"
git config user.name  "factory"
git checkout -b "$BRANCH" >&2
git add -A
git commit -q -m "$title" >&2

git push "https://x-access-token:${github_write_token}@github.com/${repo}.git" "$BRANCH" >&2

API="https://api.github.com/repos/${repo}"
AUTH="Authorization: Bearer ${github_write_token}"

EXISTING=$(curl -sS -H "$AUTH" "${API}/pulls?head=${repo%%/*}:${BRANCH}&state=open" | jq -r '.[0].number // empty')
if [ -n "$EXISTING" ]; then
  URL=$(curl -sS -H "$AUTH" "${API}/pulls/${EXISTING}" | jq -r '.html_url')
  printf '{"status":"exists","number":%s,"url":"%s","branch":"%s"}\n' "$EXISTING" "$URL" "$BRANCH"
  exit 0
fi

BODY=$(jq -nc --arg t "$title" --arg h "$BRANCH" --arg b "$base_branch" \
  '{title:$t, head:$h, base:$b, draft:true, body:"Abierto por la fábrica. Borrador: revisar antes de mergear."}')
RESP=$(curl -sS -X POST -H "$AUTH" -H "Content-Type: application/json" -d "$BODY" "${API}/pulls")
NUM=$(printf '%s' "$RESP" | jq -r '.number // empty')
URL=$(printf '%s' "$RESP" | jq -r '.html_url // empty')

if [ -z "$NUM" ]; then
  printf '%s' "$RESP" >&2
  printf '{"status":"error","reason":"no se pudo crear el PR"}\n'; exit 1
fi
printf '{"status":"created","number":%s,"url":"%s","branch":"%s"}\n' "$NUM" "$URL" "$BRANCH"
