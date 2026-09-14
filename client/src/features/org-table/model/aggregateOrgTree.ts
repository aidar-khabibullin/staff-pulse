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

/** Путь от узла к корню (сам узел первым), либо null, если узел не найден. */
export function findPathToRoot(roots: OrgTreeNode[], targetId: string): OrgTreeNode[] | null {
  for (const root of roots) {
    const path = findPathInSubtree(root, targetId)
    if (path) {
      return path
    }
  }
  return null
}

function findPathInSubtree(node: OrgTreeNode, targetId: string): OrgTreeNode[] | null {
  if (node.id === targetId) {
    return [node]
  }
  for (const child of node.children) {
    const childPath = findPathInSubtree(child, targetId)
    if (childPath) {
      return [...childPath, node]
    }
  }
  return null
}

function ownAggregate(node: OrgTreeNode, aggregates: OrgAggregateMap): OrgAggregate {
  let totalHeadcount = node.headcount
  let totalBudget = node.budget
  let weightedPerformanceSum = node.performance * node.headcount

  for (const child of node.children) {
    const childAggregate = aggregates.get(child.id)!
    totalHeadcount += childAggregate.totalHeadcount
    totalBudget += childAggregate.totalBudget
    weightedPerformanceSum += childAggregate.avgPerformance * childAggregate.totalHeadcount
  }

  const avgPerformance = totalHeadcount > 0 ? weightedPerformanceSum / totalHeadcount : 0
  return { totalHeadcount, totalBudget, avgPerformance }
}

/**
 * Частичный пересчёт агрегатов после патча одного узла: пересчитывает только
 * сам узел и его предков (снизу вверх), остальные записи карты переносятся
 * без изменений (та же ссылка).
 */
export function recalcAggregatesForPatch(
  tree: OrgTreeNode[],
  previous: OrgAggregateMap,
  patchedNodeId: string,
): OrgAggregateMap {
  const path = findPathToRoot(tree, patchedNodeId)
  if (!path) {
    return previous
  }

  const next = new Map(previous)
  for (const node of path) {
    next.set(node.id, ownAggregate(node, next))
  }
  return next
}
