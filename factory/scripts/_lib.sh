# Utilidades compartidas por todos los pasos.
# En Windmill cada paso es un script de bash independiente: este archivo se
# pega al principio de cada uno, o se mantiene como script propio y se copia.
# El resultado de un paso es la ÚLTIMA línea de stdout, así que todo paso
# termina imprimiendo exactamente una línea de JSON.

set -euo pipefail

# Directorio compartido entre pasos del mismo flow.
# Requiere que el flow tenga `same_worker: true`, si no cada paso corre en un
# worker distinto y esto no existe.
shared_dir() {
  if [ -d "./shared" ]; then printf '%s' "$(cd ./shared && pwd)";
  else mkdir -p ./shared && printf '%s' "$(cd ./shared && pwd)"; fi
}

repo_dir() { printf '%s/repo' "$(shared_dir)"; }

# Imprime una línea de JSON y termina. Uso: emit '{"ok":true}'
emit() { printf '%s\n' "$1"; }

# jq que nunca rompe el paso: si falla, devuelve null.
jqs() { jq -r "$1" 2>/dev/null || printf 'null'; }

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; }
