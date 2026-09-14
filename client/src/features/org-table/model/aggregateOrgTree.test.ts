import { describe, expect, it } from 'vitest'
import type { OrgNode } from '@/shared/api/orgNode'
import { buildOrgTree } from '@/features/org-tree/model/buildOrgTree'
import { aggregateOrgTree } from './aggregateOrgTree'

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

describe('aggregateOrgTree', () => {
  it('суммирует headcount и budget узла со всеми потомками', () => {
    const nodes: OrgNode[] = [
      makeNode({ id: 'div-1', parentId: null, headcount: 5, budget: 1000, performance: 100 }),
      makeNode({ id: 'dep-1', parentId: 'div-1', headcount: 10, budget: 2000, performance: 50 }),
      makeNode({ id: 'team-1', parentId: 'dep-1', headcount: 20, budget: 4000, performance: 80 }),
      makeNode({ id: 'team-2', parentId: 'dep-1', headcount: 20, budget: 4000, performance: 40 }),
    ]

    const tree = buildOrgTree(nodes)
    const aggregates = aggregateOrgTree(tree)

    const teamAgg = aggregates.get('team-1')!
    expect(teamAgg).toEqual({ totalHeadcount: 20, totalBudget: 4000, avgPerformance: 80 })

    const depAgg = aggregates.get('dep-1')!
    expect(depAgg.totalHeadcount).toBe(50)
    expect(depAgg.totalBudget).toBe(10000)
    // weighted: (10*50 + 20*80 + 20*40) / 50 = 2900 / 50 = 58
    expect(depAgg.avgPerformance).toBeCloseTo(58)

    const divAgg = aggregates.get('div-1')!
    expect(divAgg.totalHeadcount).toBe(55)
    expect(divAgg.totalBudget).toBe(11000)
    // weighted: (5*100 + 50*58) / 55 = (500 + 2900) / 55 = 3400 / 55
    expect(divAgg.avgPerformance).toBeCloseTo(3400 / 55)
  })

  it('для листового узла возвращает его собственные показатели', () => {
    const nodes: OrgNode[] = [makeNode({ id: 'div-1', parentId: null, headcount: 7, budget: 500, performance: 33 })]

    const aggregates = aggregateOrgTree(buildOrgTree(nodes))

    expect(aggregates.get('div-1')).toEqual({ totalHeadcount: 7, totalBudget: 500, avgPerformance: 33 })
  })

  it('вызов с одним и тем же деревом детерминирован', () => {
    const nodes: OrgNode[] = [makeNode({ id: 'div-1', parentId: null })]
    const tree = buildOrgTree(nodes)

    const first = aggregateOrgTree(tree)
    const second = aggregateOrgTree(tree)

    expect(first.get('div-1')).toEqual(second.get('div-1'))
  })
})
