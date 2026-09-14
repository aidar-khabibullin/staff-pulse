import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { OrgNode } from '@/shared/api/orgNode'
import { OrgTable } from './OrgTable'

function makeNode(overrides: Partial<OrgNode> & { id: string; parentId: string | null }): OrgNode {
  return {
    name: `node-${overrides.id}`,
    headcount: 1,
    budget: 1000,
    performance: 50,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const nodes: OrgNode[] = [
  makeNode({ id: 'div-1', name: 'Альфа дивизион', parentId: null, headcount: 5, budget: 100000, performance: 90 }),
  makeNode({ id: 'div-2', name: 'Бета дивизион', parentId: null, headcount: 3, budget: 50000, performance: 60 }),
]

function rowNames() {
  return screen.getAllByTestId('org-table-row').map((row) => within(row).getAllByRole('cell')[0].textContent)
}

describe('OrgTable', () => {
  it('отображает строки с агрегированными и отформатированными значениями', () => {
    render(<OrgTable nodes={nodes} selectedId={null} onSelect={() => {}} />)

    const rows = screen.getAllByTestId('org-table-row')
    expect(rows).toHaveLength(2)

    const firstRow = within(rows[0])
    expect(firstRow.getByText('Альфа дивизион')).toBeInTheDocument()
    expect(firstRow.getByText('100 000 руб.')).toBeInTheDocument()
  })

  it('сортирует по столбцу при клике на заголовок и переворачивает порядок по двойному клику', async () => {
    const user = userEvent.setup()
    render(<OrgTable nodes={nodes} selectedId={null} onSelect={() => {}} />)

    const nameHeader = screen.getByTestId('org-table-header-name')

    await user.click(nameHeader)
    expect(rowNames()).toEqual(['Альфа дивизион', 'Бета дивизион'])

    await user.dblClick(nameHeader)
    expect(rowNames()).toEqual(['Бета дивизион', 'Альфа дивизион'])
  })

  it('фильтрует по названию с дебаунсом', async () => {
    const user = userEvent.setup()
    render(<OrgTable nodes={nodes} selectedId={null} onSelect={() => {}} />)

    await user.type(screen.getByTestId('org-table-filter'), 'Бета')

    expect(screen.getAllByTestId('org-table-row')).toHaveLength(2)

    await waitFor(() => {
      expect(screen.getAllByTestId('org-table-row')).toHaveLength(1)
    })
    expect(screen.getByText('Бета дивизион')).toBeInTheDocument()
  })

  it('клик по строке вызывает onSelect с id узла', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<OrgTable nodes={nodes} selectedId={null} onSelect={onSelect} />)

    await user.click(screen.getAllByTestId('org-table-row')[0])

    expect(onSelect).toHaveBeenCalledWith('div-1')
  })

  it('клавиатурная навигация: стрелки перемещают фокус, Home/End к краям, Enter выбирает строку', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<OrgTable nodes={nodes} selectedId={null} onSelect={onSelect} />)

    const rows = screen.getAllByTestId('org-table-row')
    rows[0].focus()
    expect(rows[0]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(rows[1]).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(rows[0]).toHaveFocus()

    await user.keyboard('{End}')
    expect(rows[rows.length - 1]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(rows[0]).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('div-1')
  })

  it('патч подсвечивает изменённые агрегатные ячейки затронутого узла', () => {
    render(
      <OrgTable
        nodes={nodes}
        selectedId={null}
        onSelect={() => {}}
        lastPatch={{ nodeId: 'div-1', seq: 1 }}
      />,
    )

    const row = screen.getAllByTestId('org-table-row').find((r) => r.dataset.nodeId === 'div-1')!
    const headcountCell = within(row).getAllByRole('cell')[2]
    expect(headcountCell).toHaveAttribute('data-updated', 'true')
  })
})
