#!/usr/bin/env bash
# Smoke-тест: docker-compose поднимает клиент и сервер, /api/org-tree доступен через Nginx.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

CLIENT_PORT="${CLIENT_PORT:-8080}"
COMPOSE="docker compose"

cleanup() {
  echo "Останавливаю docker-compose стенд..."
  $COMPOSE down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Собираю и поднимаю docker-compose стенд..."
$COMPOSE up --build -d

echo "Жду готовности сервисов на http://localhost:${CLIENT_PORT} ..."
for i in $(seq 1 30); do
  if curl -fsS "http://localhost:${CLIENT_PORT}/api/org-tree" >/dev/null 2>&1; then
    echo "API доступен через Nginx."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Сервис не поднялся за отведённое время." >&2
    $COMPOSE logs
    exit 1
  fi
  sleep 2
done

RESPONSE=$(curl -fsS "http://localhost:${CLIENT_PORT}/api/org-tree")
NODE_COUNT=$(echo "$RESPONSE" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const a=JSON.parse(d);process.stdout.write(String(a.length));})")

if [ "$NODE_COUNT" -lt 40 ]; then
  echo "Ожидалось >=40 узлов, получено: $NODE_COUNT" >&2
  exit 1
fi
echo "OK: /api/org-tree отдал $NODE_COUNT узлов через Nginx."

if ! curl -fsS "http://localhost:${CLIENT_PORT}/" | grep -q '<div id="root">'; then
  echo "Главная страница клиента не отдаётся через Nginx." >&2
  exit 1
fi
echo "OK: клиент доступен через Nginx на http://localhost:${CLIENT_PORT}"
