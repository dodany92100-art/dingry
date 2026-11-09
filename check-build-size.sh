#!/usr/bin/env bash
# Alto Palo — mesure du poids livré (.next/static) + cache local.
# Usage:
#   ./check-build-size.sh           # mesurer .next existant
#   ./check-build-size.sh --build   # next build puis mesurer
#   ./check-build-size.sh --save    # enregistrer la baseline (avec --build si besoin)
#   ./check-build-size.sh --compare # échoue si régression vs baseline (seuil 2 %)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
BASELINE="$ROOT/scripts/build-size-baseline.json"
DO_BUILD=0
DO_SAVE=0
DO_COMPARE=0

for arg in "$@"; do
  case "$arg" in
    --build) DO_BUILD=1 ;;
    --save) DO_SAVE=1 ;;
    --compare) DO_COMPARE=1 ;;
    -h|--help)
      sed -n '2,8p' "$0"
      exit 0
      ;;
    *)
      echo "Option inconnue: $arg" >&2
      exit 2
      ;;
  esac
done

bytes_of() {
  python3 - "$1" <<'PY'
import os, sys
root = sys.argv[1]
total = 0
if not os.path.exists(root):
    print(0)
    raise SystemExit
if os.path.isfile(root):
    print(os.path.getsize(root))
    raise SystemExit
for dirpath, _, files in os.walk(root):
    for name in files:
        p = os.path.join(dirpath, name)
        try:
            total += os.path.getsize(p)
        except OSError:
            pass
print(total)
PY
}

bytes_ext() {
  python3 - "$1" "$2" <<'PY'
import os, sys
root, exts = sys.argv[1], tuple(sys.argv[2].split(","))
total = 0
if not os.path.isdir(root):
    print(0)
    raise SystemExit
for dirpath, _, files in os.walk(root):
    for name in files:
        if name.lower().endswith(exts):
            try:
                total += os.path.getsize(os.path.join(dirpath, name))
            except OSError:
                pass
print(total)
PY
}

human() {
  python3 -c "n=int(${1:-0}); u=['o','Ko','Mo','Go']; i=0
while n>=1024 and i<3:
    n/=1024; i+=1
print(f'{n:.1f} {u[i]}' if i else f'{n} {u[i]}')"
}

if [[ "$DO_BUILD" -eq 1 ]]; then
  echo "→ next build…"
  npm run build
fi

if [[ ! -d "$ROOT/.next" ]]; then
  echo "Pas de .next — lancer: ./check-build-size.sh --build" >&2
  exit 1
fi

STATIC="$ROOT/.next/static"
NEXT_B="$(bytes_of "$ROOT/.next")"
CACHE_B="$(bytes_of "$ROOT/.next/cache")"
STATIC_B="$(bytes_of "$STATIC")"
JS_B="$(bytes_ext "$STATIC" ".js,.mjs")"
CSS_B="$(bytes_ext "$STATIC" ".css")"
FONT_B="$(bytes_ext "$STATIC" ".woff,.woff2,.ttf,.otf,.eot")"
SHIPPED_B=$((STATIC_B))

ISO="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

python3 - "$BASELINE" "$ISO" "$NEXT_B" "$CACHE_B" "$STATIC_B" "$JS_B" "$CSS_B" "$FONT_B" "$SHIPPED_B" "$DO_SAVE" "$DO_COMPARE" <<'PY'
import json, os, sys

baseline_path, iso = sys.argv[1], sys.argv[2]
next_b, cache_b, static_b, js_b, css_b, font_b, shipped_b = map(int, sys.argv[3:10])
do_save, do_compare = int(sys.argv[10]), int(sys.argv[11])

def human(n: int) -> str:
    n = float(n)
    for u in ("o", "Ko", "Mo", "Go"):
        if n < 1024 or u == "Go":
            return f"{n:.1f} {u}" if u != "o" else f"{int(n)} o"
        n /= 1024
    return f"{n:.1f} Go"

current = {
    "iso": iso,
    "next_bytes": next_b,
    "cache_bytes": cache_b,
    "static_bytes": static_b,
    "js_bytes": js_b,
    "css_bytes": css_b,
    "font_bytes": font_b,
    "shipped_bytes": shipped_b,
}

print("=== Alto Palo · taille build ===")
print(f"horodatage     {iso}")
print(f".next total    {human(next_b):>10}  ({next_b} o)  [cache local inclus]")
print(f".next/cache    {human(cache_b):>10}  ({cache_b} o)  [non livré]")
print(f".next/static   {human(static_b):>10}  ({static_b} o)  ← assets livrés")
print(f"  JS           {human(js_b):>10}  ({js_b} o)")
print(f"  CSS          {human(css_b):>10}  ({css_b} o)")
print(f"  polices      {human(font_b):>10}  ({font_b} o)")
print()

prev = None
if os.path.isfile(baseline_path):
    with open(baseline_path, encoding="utf-8") as f:
        prev = json.load(f)

if prev:
    print("=== Delta vs baseline ===")
    keys = (
        ("shipped_bytes", "livré (static)"),
        ("js_bytes", "JS"),
        ("css_bytes", "CSS"),
        ("font_bytes", "polices"),
        ("next_bytes", ".next total"),
    )
    regress = False
    for key, label in keys:
        a, b = int(prev.get(key, 0)), int(current[key])
        d = b - a
        sign = "+" if d > 0 else ""
        print(f"{label:<16} {human(a)} → {human(b)}  ({sign}{d} o)")
        if key == "shipped_bytes" and a > 0 and d > a * 0.02:
            regress = True
    print()
    if do_compare and regress:
        print("ÉCHEC: régression > 2 % sur .next/static", file=sys.stderr)
        raise SystemExit(1)
elif do_compare:
    print("Pas de baseline — lancer avec --save après un build propre.", file=sys.stderr)
    raise SystemExit(1)
else:
    print("Pas de baseline (scripts/build-size-baseline.json).")
    print("Relancer avec --save pour figer cette mesure.")
    print()

if do_save:
    os.makedirs(os.path.dirname(baseline_path), exist_ok=True)
    with open(baseline_path, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
        f.write("\n")
    print(f"Baseline enregistrée → {baseline_path}")
PY
