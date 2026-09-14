import type { OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'

export interface OrgAggregate {
  totalHeadcount: number
  totalBudget: number
  avgPerformance: number
}

export type OrgAggregateMap = Map<string, OrgAggregate>

function visit(node: OrgTreeNode, result: OrgAggregateMap): OrgAggregate {
  let totalHeadcount = node.headcount
  let totalBudget = node.budget
  let weightedPerformanceSum = node.performance * node.headcount

  for (const child of node.children) {
    const childAggregate = visit(child, result)
    totalHeadcount += childAggregate.totalHeadcount
    totalBudget += childAggregate.totalBudget
    weightedPerformanceSum += childAggregate.avgPerformance * childAggregate.totalHeadcount
  }

  const avgPerformance = totalHeadcount > 0 ? weightedPerformanceSum / totalHeadcount : 0
  const aggregate: OrgAggregate = { totalHeadcount, totalBudget, avgPerformance }
  result.set(node.id, aggregate)
  return aggregate
}

export function aggregateOrgTree(roots: OrgTreeNode[]): OrgAggregateMap {
  const result: OrgAggregateMap = new Map()
  for (const root of roots) {
    visit(root, result)
  }
  return result
}
