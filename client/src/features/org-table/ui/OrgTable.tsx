import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { OrgNode } from '@/shared/api/orgNode'
import { buildOrgTree, type OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'
import { computeMatchedIdsByAggregate } from '@/features/ai-search/model/applyStructuredFilter'
import type { StructuredFilter } from '@/features/ai-search/model/structuredFilter'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { findPathToRoot, type OrgAggregate } from '../model/aggregateOrgTree'
import { flattenOrgTree } from '../model/flattenOrgTree'
import { formatBudget } from '../model/formatBudget'
import { useIncrementalAggregates, type PatchEvent } from '../model/useIncrementalAggregates'
import {
  Cell,
  Container,
  EmptyCell,
  FilterInput,
  HeaderCell,
  Row,
  SortIndicator,
  Table,
  TableScrollArea,
} from './OrgTable.styles'

const FILTER_DEBOUNCE_MS = 250
const HIGHLIGHT_DURATION_MS = 1500
const AGGREGATE_COLUMNS: SortColumn[] = ['headcount', 'budget', 'performance']

type SortColumn = 'name' | 'level' | 'headcount' | 'budget' | 'performance'
type SortDirection = 'asc' | 'desc'

interface Column {
  key: SortColumn
  label: string
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Подразделение' },
  { key: 'level', label: 'Уровень' },
  { key: 'headcount', label: 'Всего сотрудников' },
  { key: 'budget', label: 'Бюджет суммарный' },
  { key: 'performance', label: 'Средняя эффективность' },
]

interface TableRow {
  node: OrgTreeNode
  aggregate: OrgAggregate
}

function sortValue(row: TableRow, column: SortColumn): string | number {
  switch (column) {
    case 'name':
      return row.node.name
    case 'level':
      return row.node.level
    case 'headcount':
      return row.aggregate.totalHeadcount
    case 'budget':
      return row.aggregate.totalBudget
    case 'performance':
      return row.aggregate.avgPerformance
  }
}

function compareRows(a: TableRow, b: TableRow, column: SortColumn, direction: SortDirection): number {
  const va = sortValue(a, column)
  const vb = sortValue(b, column)

  let result: number
  if (typeof va === 'string' && typeof vb === 'string') {
    result = va.localeCompare(vb, 'ru')
  } else {
    result = (va as number) - (vb as number)
  }

  return direction === 'asc' ? result : -result
}

interface OrgTableProps {
  nodes: OrgNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  lastPatch?: PatchEvent | null
  filter?: StructuredFilter | null
}

export function OrgTable({ nodes, selectedId, onSelect, lastPatch = null, filter = null }: OrgTableProps) {
  const [filterText, setFilterText] = useState('')
  const debouncedFilterText = useDebouncedValue(filterText, FILTER_DEBOUNCE_MS)
  const [sortColumn, setSortColumn] = useState<SortColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [isHighlightActive, setIsHighlightActive] = useState(false)
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])

  const tree = useMemo(() => buildOrgTree(nodes), [nodes])
  const aggregates = useIncrementalAggregates(tree, lastPatch)
  const flatNodes = useMemo(() => flattenOrgTree(tree), [tree])
  // Фильтр таблицы сверяется с агрегированными по потомкам значениями (totalHeadcount/
  // totalBudget/avgPerformance), а не с сырым полем узла — это те же числа, что показаны
  // в колонках «Всего сотрудников»/«Бюджет суммарный»/«Средняя эффективность».
  const matchedIds = useMemo(
    () => (filter ? computeMatchedIdsByAggregate(tree, aggregates, filter) : null),
    [tree, aggregates, filter],
  )

  const highlightedNodeIds = useMemo(() => {
    if (!lastPatch) {
      return null
    }
    const path = findPathToRoot(tree, lastPatch.nodeId)
    return path ? new Set(path.map((node) => node.id)) : null
  }, [tree, lastPatch])

  useEffect(() => {
    if (!lastPatch) {
      return
    }
    setIsHighlightActive(true)
    const timer = setTimeout(() => setIsHighlightActive(false), HIGHLIGHT_DURATION_MS)
    return () => clearTimeout(timer)
  }, [lastPatch])

  const rows = useMemo(() => {
    const normalizedFilter = debouncedFilterText.trim().toLowerCase()

    const filtered = flatNodes
      .filter((node) => node.name.toLowerCase().includes(normalizedFilter))
      .filter((node) => matchedIds === null || matchedIds.has(node.id))
      .map((node) => ({ node, aggregate: aggregates.get(node.id)! }))

    return filtered.sort((a, b) => compareRows(a, b, sortColumn, sortDirection))
  }, [flatNodes, aggregates, debouncedFilterText, sortColumn, sortDirection, matchedIds])

  useEffect(() => {
    setFocusedIndex((prev) => Math.min(prev, Math.max(rows.length - 1, 0)))
  }, [rows.length])

  const handleHeaderClick = (column: SortColumn) => {
    setSortColumn(column)
    setSortDirection('asc')
  }

  const handleHeaderDoubleClick = (column: SortColumn) => {
    setSortColumn(column)
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const focusRow = (index: number) => {
    if (rows.length === 0) {
      return
    }
    const clamped = Math.max(0, Math.min(index, rows.length - 1))
    setFocusedIndex(clamped)
    rowRefs.current[clamped]?.focus()
  }

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusRow(index + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        focusRow(index - 1)
        break
      case 'Home':
        event.preventDefault()
        focusRow(0)
        break
      case 'End':
        event.preventDefault()
        focusRow(rows.length - 1)
        break
      case 'Enter':
        event.preventDefault()
        onSelect(rows[index].node.id)
        break
      default:
        break
    }
  }

  const isCellHighlighted = (nodeId: string, column: SortColumn): boolean =>
    isHighlightActive && (AGGREGATE_COLUMNS as string[]).includes(column) && (highlightedNodeIds?.has(nodeId) ?? false)

  return (
    <Container>
      <FilterInput
        type="text"
        data-testid="org-table-filter"
        placeholder="Фильтр по названию…"
        value={filterText}
        onChange={(event) => setFilterText(event.target.value)}
      />

      <TableScrollArea>
        <Table data-testid="org-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <HeaderCell
                  key={column.key}
                  data-testid={`org-table-header-${column.key}`}
                  aria-sort={
                    sortColumn === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                  onClick={() => handleHeaderClick(column.key)}
                  onDoubleClick={() => handleHeaderDoubleClick(column.key)}
                >
                  {column.label}
                  {sortColumn === column.key && (
                    <SortIndicator aria-hidden="true">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</SortIndicator>
                  )}
                </HeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ node, aggregate }, index) => (
              <Row
                key={node.id}
                ref={(element) => {
                  rowRefs.current[index] = element
                }}
                data-testid="org-table-row"
                data-node-id={node.id}
                data-selected={node.id === selectedId}
                tabIndex={index === focusedIndex ? 0 : -1}
                onClick={() => {
                  setFocusedIndex(index)
                  onSelect(node.id)
                }}
                onFocus={() => setFocusedIndex(index)}
                onKeyDown={(event) => handleRowKeyDown(event, index)}
              >
                <Cell>{node.name}</Cell>
                <Cell>{node.level + 1}</Cell>
                <Cell data-updated={isCellHighlighted(node.id, 'headcount')}>{aggregate.totalHeadcount}</Cell>
                <Cell data-updated={isCellHighlighted(node.id, 'budget')}>{formatBudget(aggregate.totalBudget)}</Cell>
                <Cell data-updated={isCellHighlighted(node.id, 'performance')}>
                  {aggregate.avgPerformance.toFixed(1)}
                </Cell>
              </Row>
            ))}

            {rows.length === 0 && (
              <tr>
                <EmptyCell colSpan={COLUMNS.length} data-testid="org-table-empty">
                  Ничего не найдено
                </EmptyCell>
              </tr>
            )}
          </tbody>
        </Table>
      </TableScrollArea>
    </Container>
  )
}
