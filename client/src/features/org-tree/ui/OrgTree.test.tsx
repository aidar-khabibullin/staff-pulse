import { screen } from '@testing-library/react'
import { renderWithTheme as render } from '@/shared/lib/test/renderWithTheme'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { OrgNode } from '@/shared/api/orgNode'
import { OrgTree } from './OrgTree'

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
  makeNode({ id: 'div-1', name: 'Дивизион продаж', parentId: null }),
  makeNode({ id: 'dep-1', name: 'Отдел аналитики', parentId: 'div-1' }),
  makeNode({ id: 'team-1', name: 'Команда фронтенда', parentId: 'dep-1' }),
]

describe('OrgTree', () => {
  it('открывает второй уровень по умолчанию, скрывая третий', () => {
    render(<OrgTree nodes={nodes} />)

    expect(screen.getByText('Дивизион продаж')).toBeInTheDocument()
    expect(screen.getByText('Отдел аналитики')).toBeInTheDocument()
    expect(screen.queryByText('Команда фронтенда')).not.toBeInTheDocument()
  })

  it('раскрывает и скрывает потомков по клику на узел', async () => {
    const user = userEvent.setup()
    render(<OrgTree nodes={nodes} />)

    const toggles = screen.getAllByTestId('org-tree-toggle')
    const departmentToggle = toggles[1]

    await user.click(departmentToggle)
    expect(screen.getByText('Команда фронтенда')).toBeInTheDocument()

    await user.click(departmentToggle)
    expect(screen.queryByText('Команда фронтенда')).not.toBeInTheDocument()
  })
})
