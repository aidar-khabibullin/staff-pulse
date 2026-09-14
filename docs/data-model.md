# Модель данных

## Узел орг-структуры

Сервер отдаёт плоский массив узлов (`GET /api/org-tree`), без вложенности:

```ts
interface OrgNode {
  id: string
  name: string
  parentId: string | null // null — узел верхнего уровня (дивизион)
  headcount: number
  budget: number
  performance: number // 0..100
  updatedAt: string // ISO 8601
}
```

Валидация на клиенте — zod-схема `orgNodeSchema`/`orgTreeResponseSchema` (`client/src/shared/api/orgNode.ts`); ответ, не прошедший схему, трактуется как ошибка ещё на уровне `useOrgTree`, до попадания в компоненты.

Мок-данные (сервер): ≥40 узлов, ≥3 уровня вложенности (дивизион → отдел → команда), `parentId` ссылается на существующий узел или `null`.

## Построение дерева

`buildOrgTree(nodes: OrgNode[]): OrgTreeNode[]` (`client/src/features/org-tree/model/buildOrgTree.ts`) — чистая функция без побочных эффектов:

1. Индексирует все узлы по `id` в `Map`, оборачивая каждый в `OrgTreeNode extends OrgNode { children: OrgTreeNode[]; level: number }`.
2. Проходит по узлам второй раз: узел с `parentId === null` или с `parentId`, не найденным в индексе (битая ссылка), становится корнем; иначе добавляется в `children` родителя.
3. Рекурсивно проставляет `level`, начиная с 0 у корней.

Сложность — O(n). Результат используется и деревом, и таблицей (через `flattenOrgTree`), и AI-поиском.

## Алгоритм агрегации

`aggregateOrgTree(roots: OrgTreeNode[]): Map<string, OrgAggregate>` (`client/src/features/org-table/model/aggregateOrgTree.ts`), где

```ts
interface OrgAggregate {
  totalHeadcount: number  // headcount узла + всех потомков
  totalBudget: number     // budget узла + всех потомков
  avgPerformance: number  // performance, взвешенная по headcount
}
```

Обход дерева в глубину, снизу вверх (post-order): для листа агрегат равен его собственным полям; для внутреннего узла — сумма `headcount`/`budget` узла и агрегатов всех детей, а `avgPerformance` — средневзвешенное по `headcount`:

```
avgPerformance(node) = Σ(performance_i × headcount_i) / Σ(headcount_i)
```

где сумма берётся по узлу и по агрегатам всех его потомков (уже взвешенным на предыдущем шаге рекурсии — так вес поддерева, а не отдельного узла, участвует в родительском среднем). Если `totalHeadcount === 0`, `avgPerformance = 0` (деление на ноль исключено явной проверкой).

Результат — `Map<id, OrgAggregate>`, вычисляется один раз после загрузки данных и мемоизируется в `useIncrementalAggregates` (`useMemo`, инвалидация только при смене набора id узлов или явном live-патче) — повторный рендер без изменения входных данных агрегаты не пересчитывает.

### Частичный пересчёт при live-патче

`recalcAggregatesForPatch(tree, previous, patchedNodeId)`:

1. `findPathToRoot` находит путь «изменённый узел → …предки… → корень» (обход дерева, O(глубина дерева) в среднем).
2. Для каждого узла на этом пути (снизу вверх) агрегат пересчитывается заново из уже актуальных агрегатов детей (`ownAggregate`).
3. Все остальные записи `Map` копируются по ссылке без изменений — новый объект агрегата создаётся только для затронутого узла и его предков, а не для всего дерева.

`useIncrementalAggregates` решает, какой путь пересчёта применить:

- набор id узлов изменился (или это первый рендер) → полный `aggregateOrgTree`;
- набор тот же и пришёл новый `patch` (по монотонному `seq`) → `recalcAggregatesForPatch`;
- иначе → предыдущая `Map` без изменений (та же ссылка, React не перерендерит потребителей).

## Контракт live-патча

WebSocket-канал `GET /ws/org-tree`. Раз в `LIVE_UPDATE_INTERVAL_SECONDS` (по умолчанию 1с) сервер выбирает случайный узел и случайное поле из `headcount`/`budget`/`performance`, мутирует его in-place (со случайной дельтой в пределах поля и clamp по границам: `headcount ≥ 1`, `budget ≥ 100 000`, `0 ≤ performance ≤ 100`) и рассылает всем подключённым клиентам сообщение:

```ts
interface OrgNodePatchMessage {
  id: string                      // id изменённого узла
  changes: Record<string, number> // только реально изменившееся поле(-я), например { performance: 82 }
  updatedAt: string                // новый ISO-таймстамп узла
}
```

На сервере это `OrgNodePatch` (`server/app/models.py`), сериализуется в camelCase (`updatedAt`) через pydantic alias. На клиенте `useOrgTreeLiveUpdates` валидирует форму сообщения (`isPatchMessage`) перед вызовом колбэка; `useOrgTree.applyPatch` точечно заменяет один узел в кэше (`{ ...node, ...patch.changes, updatedAt: patch.updatedAt }`) без рефетча всего дерева. Затронутый узел и его предки помечаются как изменённые для fade-подсветки в таблице и для частичного пересчёта агрегатов (см. выше).

При обрыве соединения клиент переподключается с экспоненциальным backoff (1с, 2с, 4с, …, максимум 30с), сбрасывая задержку до начальной при успешном подключении.
