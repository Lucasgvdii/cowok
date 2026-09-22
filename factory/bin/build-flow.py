#!/usr/bin/env python3
"""Resuelve los '!inline scripts/xx.sh' del flow y escribe el flow final.

Los scripts viven en archivos propios para poder probarlos con bash y
shellcheck. Windmill quiere el contenido embebido en el flow. Esto une las dos
cosas: editás el .sh, corrés esto, y el flow queda actualizado.

Uso:  python3 bin/build-flow.py [flows/claude_run.flow.yaml]
Sale: flows/<nombre>.built.yaml
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "flows/claude_run.flow.yaml"
raw = src.read_text()

INLINE = re.compile(r"^(?P<indent>\s*)content:\s*'!inline (?P<path>[^']+)'\s*$", re.M)


def indent_block(text: str, indent: str) -> str:
    """Devuelve el script como bloque literal de YAML, sin tocar su contenido."""
    body = "\n".join((indent + "  " + line).rstrip() for line in text.split("\n"))
    return f"{indent}content: |\n{body}"


missing = []


def repl(m: re.Match) -> str:
    path = ROOT / m.group("path")
    if not path.exists():
        missing.append(m.group("path"))
        return m.group(0)
    return indent_block(path.read_text().rstrip("\n"), m.group("indent"))


out = INLINE.sub(repl, raw)
if missing:
    sys.exit("faltan scripts: " + ", ".join(missing))
# Solo importan los marcadores activos: los que están dentro de un comentario
# del YAML (el paso de PR, apagado por defecto) se dejan como están.
if INLINE.search(out):
    sys.exit("quedaron marcadores !inline sin resolver")

dest = src.with_suffix("").with_suffix(".built.yaml")
dest.write_text(out)

# Verificación: que siga siendo YAML válido y que cada paso tenga su script.
try:
    import yaml
    doc = yaml.safe_load(out)
    mods = doc["value"]["modules"]
    for mod in mods:
        content = mod["value"]["content"]
        assert content.strip().startswith("#!"), f"{mod['id']}: el content no parece un script"
    print(f"ok · {dest.relative_to(ROOT)} · {len(mods)} pasos · {len(out)} bytes")
except ImportError:
    print(f"ok · {dest.relative_to(ROOT)} · (sin pyyaml, no se validó la estructura)")
