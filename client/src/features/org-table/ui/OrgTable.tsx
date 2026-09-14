import { useMemo, useState } from 'react'
import type { OrgNode } from '@/shared/api/orgNode'
import { buildOrgTree, type OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { aggregateOrgTree, type OrgAggregate } from '../model/aggregateOrgTree'
import { flattenOrgTree } from '../model/flattenOrgTree'
import { formatBudget } from '../model/formatBudget'
import styles from './OrgTable.module.css'

const FILTER_DEBOUNCE_MS = 250

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
}

export function OrgTable({ nodes, selectedId, onSelect }: OrgTableProps) {
  const [filterText, setFilterText] = useState('')
  const debouncedFilterText = useDebouncedValue(filterText, FILTER_DEBOUNCE_MS)
  const [sortColumn, setSortColumn] = useState<SortColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const tree = useMemo(() => buildOrgTree(nodes), [nodes])
  const aggregates = useMemo(() => aggregateOrgTree(tree), [tree])
  const flatNodes = useMemo(() => flattenOrgTree(tree), [tree])

  const rows = useMemo(() => {
    const normalizedFilter = debouncedFilterText.trim().toLowerCase()

    const filtered = flatNodes
      .filter((node) => node.name.toLowerCase().includes(normalizedFilter))
      .map((node) => ({ node, aggregate: aggregates.get(node.id)! }))

    return filtered.sort((a, b) => compareRows(a, b, sortColumn, sortDirection))
  }, [flatNodes, aggregates, debouncedFilterText, sortColumn, sortDirection])

  const handleHeaderClick = (column: SortColumn) => {
    setSortColumn(column)
    setSortDirection('asc')
  }

  const handleHeaderDoubleClick = (column: SortColumn) => {
    setSortColumn(column)
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

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
          {rows.map(({ node, aggregate }) => (
            <tr
              key={node.id}
              className={styles.row}
              data-testid="org-table-row"
              data-node-id={node.id}
              data-selected={node.id === selectedId}
              onClick={() => onSelect(node.id)}
            >
              <td className={styles.cell}>{node.name}</td>
              <td className={styles.cell}>{node.level + 1}</td>
              <td className={styles.cell}>{aggregate.totalHeadcount}</td>
              <td className={styles.cell}>{formatBudget(aggregate.totalBudget)}</td>
              <td className={styles.cell}>{aggregate.avgPerformance.toFixed(1)}</td>
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
