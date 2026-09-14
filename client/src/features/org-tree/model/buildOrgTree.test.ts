import { describe, expect, it } from 'vitest'
import type { OrgNode } from '@/shared/api/orgNode'
import { buildOrgTree } from './buildOrgTree'

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

describe('buildOrgTree', () => {
  it('строит иерархию дивизион → отдел → команда из плоского массива', () => {
    const nodes: OrgNode[] = [
      makeNode({ id: 'div-1', parentId: null }),
      makeNode({ id: 'dep-1', parentId: 'div-1' }),
      makeNode({ id: 'team-1', parentId: 'dep-1' }),
      makeNode({ id: 'team-2', parentId: 'dep-1' }),
      makeNode({ id: 'dep-2', parentId: 'div-1' }),
    ]

    const tree = buildOrgTree(nodes)

    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe('div-1')
    expect(tree[0].level).toBe(0)
    expect(tree[0].children).toHaveLength(2)

    const dep1 = tree[0].children.find((n) => n.id === 'dep-1')!
    expect(dep1.level).toBe(1)
    expect(dep1.children.map((n) => n.id).sort()).toEqual(['team-1', 'team-2'])
    expect(dep1.children[0].level).toBe(2)
  })

  it('поддерживает несколько корневых узлов и не теряет узлы без потомков', () => {
    const nodes: OrgNode[] = [
      makeNode({ id: 'div-1', parentId: null }),
      makeNode({ id: 'div-2', parentId: null }),
      makeNode({ id: 'dep-1', parentId: 'div-1' }),
    ]

    const tree = buildOrgTree(nodes)

    expect(tree).toHaveLength(2)
    const div2 = tree.find((n) => n.id === 'div-2')!
    expect(div2.children).toHaveLength(0)
  })

  it('трактует узел с несуществующим parentId как корень', () => {
    const nodes: OrgNode[] = [makeNode({ id: 'orphan-1', parentId: 'missing' })]

    const tree = buildOrgTree(nodes)

    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe('orphan-1')
    expect(tree[0].level).toBe(0)
  })
})
