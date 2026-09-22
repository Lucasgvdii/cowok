#!/usr/bin/env bash
# Paso 5 · recoger el artifact
# El agente no publica nada: deja un diff. Esto lo empaqueta y lo describe.
set -euo pipefail
SHARED="$(cd ./shared && pwd)"
DEST="$SHARED/repo"
PATCH="$SHARED/patch.diff"

git -C "$DEST" add -A
git -C "$DEST" diff --cached > "$PATCH"

BASE=$(git -C "$DEST" rev-parse HEAD)
FILES=$(git -C "$DEST" diff --cached --name-only | jq -R . | jq -sc .)
STAT=$(git -C "$DEST" diff --cached --shortstat | tr -d '\n')
BYTES=$(wc -c < "$PATCH" | tr -d ' ')
DIGEST=$( (sha256sum "$PATCH" 2>/dev/null || shasum -a 256 "$PATCH") | cut -d' ' -f1 )

printf '{"kind":"patch","base_sha":"%s","files":%s,"shortstat":%s,"bytes":%s,"digest":"%s","path":"%s"}\n' \
  "$BASE" "$FILES" "$(printf '%s' "$STAT" | jq -R .)" "$BYTES" "$DIGEST" "$PATCH"
