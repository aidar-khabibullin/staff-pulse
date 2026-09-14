# Архитектура

Обзор слоёв приложения и потока данных от API до UI. См. также [`docs/data-model.md`](data-model.md) (структура дерева, алгоритм агрегации, контракт live-патча) и [ADR](adr/) для обоснования нетривиальных решений.

## Компоненты системы

```
┌─────────────┐        HTTP  GET /api/org-tree        ┌──────────────────┐
│             │ ─────────────────────────────────────▶│                  │
│   Клиент    │        WS    /ws/org-tree (патчи)      │  Сервер (mock    │
│ (Vite/React)│ ◀─────────────────────────────────────▶│  API, FastAPI)   │
│             │                                         │                  │
└─────────────┘                                         └──────────────────┘
      ▲
      │ статика + gzip + reverse-proxy /api, /ws
      │
┌─────────────┐
│    Nginx    │  (только в production/Docker; см. ADR 0002)
└─────────────┘
```

В dev-режиме клиент (`vite dev`, порт 5173) обращается напрямую к серверу (`uvicorn`, порт 4000). В Docker Nginx отдаёт собранную статику клиента и проксирует `/api/*` и `/ws/*` на контейнер сервера — оба сервиса работают через один origin, отдельная настройка CORS не требуется.

## Backend (`server/`)

Python 3.12 + FastAPI + uvicorn (см. [ADR 0001](adr/0001-backend-python-fastapi.md) о переходе с Node/Express).

- `app/main.py` — точка входа: HTTP-эндпоинт `GET /api/org-tree`, WebSocket-эндпоинт `GET /ws/org-tree`, фоновая asyncio-задача live-обновлений в `lifespan`.
- `app/data.py` (генератор мок-данных) — при старте процесса генерирует плоский список узлов (≥40, ≥3 уровня вложенности) и хранит его в памяти как единственный источник состояния сервера на время его жизни.
- `app/models.py` — pydantic-модели `OrgNode` (контракт узла) и `OrgNodePatch` (контракт live-патча, см. [data-model.md](data-model.md#контракт-live-патча)).
- `app/live_updates.py` — `generate_patch()` мутирует случайный узел in-place и возвращает патч; `ConnectionManager` держит множество активных WebSocket-соединений и рассылает патчи всем, устойчиво к обрыву отдельного клиента.

Состояние — только в памяти процесса; при перезапуске сервера данные генерируются заново. Это соответствует требованиям задания (без БД).

## Frontend (`client/`)

Vite + React + TypeScript, слои по функциональному признаку (`shared/`, `features/`, `app/`):

### Слой данных (`shared/api`, `shared/lib`)

1. `shared/api/orgNode.ts` — zod-схема `orgNodeSchema`/`orgTreeResponseSchema`; невалидный ответ сервера трактуется как ошибка ещё до того, как данные попадут в компоненты.
2. `shared/api/orgTreeClient.ts` — `fetch` с `AbortSignal`.
3. `shared/lib/useOrgTree.ts` — кэширующий хук: модуль-level `Map`-кэш с stale time 5с (stale-while-revalidate — при повторном монтировании сразу отдаёт закэшированные данные и в фоне ревалидирует, если протухли), отмена запроса через `AbortController` при unmount, метод `applyPatch` для точечного обновления одного узла в кэше без рефетча.
4. `shared/lib/useOrgTreeLiveUpdates.ts` — подключение к `ws://…/ws/org-tree`, парсинг и валидация формы патча, статус соединения (`connecting`/`open`/`reconnecting`/`closed`), переподключение с экспоненциальным backoff (1с → ×2 → максимум 30с).

### Дерево (`features/org-tree`)

`buildOrgTree.ts` — чистая функция: плоский массив → массив корней с `children`/`level` (см. [data-model.md](data-model.md#построение-дерева)). `OrgTree.tsx` — рендер с раскрытием/скрытием ветвей, вторым уровнем открытым по умолчанию, цветовым индикатором `performance`, CSS-анимацией высоты при раскрытии (учитывает `prefers-reduced-motion`).

### Таблица и агрегация (`features/org-table`)

- `aggregateOrgTree.ts` — рекурсивный обход дерева, вычисляет по каждому узлу сумму `headcount`/`budget` и взвешенную по `headcount` `performance` для узла и всех его потомков (см. [data-model.md](data-model.md#алгоритм-агрегации)); `recalcAggregatesForPatch` пересчитывает только путь «изменённый узел → корень».
- `useIncrementalAggregates.ts` — обёртка на `useMemo`: полный пересчёт агрегатов только при первой загрузке или изменении набора id узлов; при точечном live-патче — частичный пересчёт по пути к корню; во всех остальных рендерах — та же ссылка на `Map` (агрегаты действительно вычисляются один раз и мемоизируются).
- `OrgTable.tsx` — сортировка по столбцу (клик/двойной клик — реверс), дебаунс фильтра по названию (250мс, `useDebouncedValue`), клик по строке синхронизирует выделение с деревом, fade-подсветка обновлённых ячеек (~1.5с), клавиатурная навигация (стрелки/Home/End/Enter).

### AI-поиск (`features/ai-search`)

`parseNaturalLanguageQuery.ts` — детерминированный парсер запроса на естественном языке в структурированный фильтр `{ text, level, metric }` (без внешнего LLM API, см. [ADR 0003](adr/0003-ai-search-deterministic-parser.md)); `applyStructuredFilter.ts`/`pruneTree.ts` применяют фильтр к дереву и к таблице; при нераспознанном запросе — fallback на обычный текстовый поиск по названию.

### Композиция (`app/App.tsx`)

Собирает данные (`useOrgTree` + `useOrgTreeLiveUpdates`), строит дерево и агрегаты, переключает "Дерево/Таблица" (или split-view ≥1280px), хранит `selectedId` и состояние AI-поиска, показывает индикатор соединения в шапке.

## Production/Docker

`server/Dockerfile` и `client/Dockerfile` (multi-stage: сборка на `node:22-slim`, отдача статики через `nginx:1.27-alpine`) + `docker-compose.yml` в корне; `client/nginx.conf` — gzip, проксирование `/api/*` и `/ws/*` (с апгрейдом соединения для WebSocket), SPA fallback. Подробности — в README, раздел «Запуск проекта».
