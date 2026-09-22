#!/usr/bin/env bash
# Paso 1 · clone
# Credenciales: github_read_token (solo lectura). El agente NO ve este token.
repo="$1"                 # "owner/name"
branch="${2:-main}"
github_read_token="${3:-}"

set -euo pipefail
source "$(dirname "$0")/_lib.sh" 2>/dev/null || true
shared_dir() { mkdir -p ./shared && (cd ./shared && pwd); }
DEST="$(shared_dir)/repo"

rm -rf "$DEST"; mkdir -p "$DEST"

if [ -n "$github_read_token" ]; then
  URL="https://x-access-token:${github_read_token}@github.com/${repo}.git"
else
  URL="https://github.com/${repo}.git"
fi

git clone --depth 1 --branch "$branch" "$URL" "$DEST" >&2
# No dejamos el token escrito en .git/config
git -C "$DEST" remote set-url origin "https://github.com/${repo}.git"

SHA="$(git -C "$DEST" rev-parse HEAD)"
FILES="$(git -C "$DEST" ls-files | wc -l | tr -d ' ')"
printf '{"repo":"%s","branch":"%s","base_sha":"%s","files":%s,"path":"%s"}\n' \
  "$repo" "$branch" "$SHA" "$FILES" "$DEST"
