import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { OrgNode } from '@/shared/api/orgNode'
import { buildOrgTree, type OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { findPathToRoot, type OrgAggregate } from '../model/aggregateOrgTree'
import { flattenOrgTree } from '../model/flattenOrgTree'
import { formatBudget } from '../model/formatBudget'
import { useIncrementalAggregates, type PatchEvent } from '../model/useIncrementalAggregates'
import styles from './OrgTable.module.css'

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

interface Row {
  node: OrgTreeNode
  aggregate: OrgAggregate
}

function sortValue(row: Row, column: SortColumn): string | number {
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

function compareRows(a: Row, b: Row, column: SortColumn, direction: SortDirection): number {
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
}

export function OrgTable({ nodes, selectedId, onSelect, lastPatch = null }: OrgTableProps) {
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
      .map((node) => ({ node, aggregate: aggregates.get(node.id)! }))

    return filtered.sort((a, b) => compareRows(a, b, sortColumn, sortDirection))
  }, [flatNodes, aggregates, debouncedFilterText, sortColumn, sortDirection])

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
    <div className={styles.container}>
      <input
        type="text"
        className={styles.filterInput}
        data-testid="org-table-filter"
        placeholder="Фильтр по названию…"
        value={filterText}
        onChange={(event) => setFilterText(event.target.value)}
      />

      <table className={styles.table} data-testid="org-table">
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                className={styles.headerCell}
                data-testid={`org-table-header-${column.key}`}
                aria-sort={
                  sortColumn === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
                }
                onClick={() => handleHeaderClick(column.key)}
                onDoubleClick={() => handleHeaderDoubleClick(column.key)}
              >
                {column.label}
                {sortColumn === column.key && (
                  <span className={styles.sortIndicator} aria-hidden="true">
                    {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ node, aggregate }, index) => (
            <tr
              key={node.id}
              ref={(element) => {
                rowRefs.current[index] = element
              }}
              className={styles.row}
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
              <td className={styles.cell}>{node.name}</td>
              <td className={styles.cell}>{node.level + 1}</td>
              <td
                className={styles.cell}
                data-updated={isCellHighlighted(node.id, 'headcount')}
              >
                {aggregate.totalHeadcount}
              </td>
              <td className={styles.cell} data-updated={isCellHighlighted(node.id, 'budget')}>
                {formatBudget(aggregate.totalBudget)}
              </td>
              <td
                className={styles.cell}
                data-updated={isCellHighlighted(node.id, 'performance')}
              >
                {aggregate.avgPerformance.toFixed(1)}
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td className={styles.emptyCell} colSpan={COLUMNS.length} data-testid="org-table-empty">
                Ничего не найдено
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
