#!/usr/bin/env bash
# Проверяет, что production-сборка клиента (JS + CSS, gzip) укладывается в лимит.
set -euo pipefail

LIMIT_KB="${BUNDLE_SIZE_LIMIT_KB:-200}"
LIMIT_BYTES=$((LIMIT_KB * 1024))

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$REPO_ROOT/client"
DIST_DIR="$CLIENT_DIR/dist"

echo "Собираю production-бандл клиента..."
(cd "$CLIENT_DIR" && npm run build --silent)

if [ ! -d "$DIST_DIR/assets" ]; then
  echo "Не найдена директория $DIST_DIR/assets — сборка не создала ожидаемые ассеты." >&2
  exit 1
fi

TOTAL_BYTES=0
while IFS= read -r -d '' file; do
  size=$(gzip -c "$file" | wc -c)
  TOTAL_BYTES=$((TOTAL_BYTES + size))
  printf '  %-60s %6d B (gzip)\n' "${file#"$REPO_ROOT"/}" "$size"
done < <(find "$DIST_DIR/assets" -type f \( -name '*.js' -o -name '*.css' \) -print0)

TOTAL_KB=$((TOTAL_BYTES / 1024))
echo "Итого: ${TOTAL_BYTES} B (~${TOTAL_KB} KB) gzip, лимит: ${LIMIT_BYTES} B (${LIMIT_KB} KB)"

if [ "$TOTAL_BYTES" -gt "$LIMIT_BYTES" ]; then
  echo "Превышен лимит размера production-сборки (${LIMIT_KB} KB gzip)." >&2
  exit 1
fi

echo "OK: сборка укладывается в лимит."
