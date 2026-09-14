import type { OrgNode } from '@/shared/api/orgNode'
import type { OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'
import type { MetricCondition, StructuredFilter } from './structuredFilter'
import { isEmptyFilter } from './structuredFilter'

function matchesMetric(node: OrgNode, metric: MetricCondition): boolean {
  const value = node[metric.field]
  switch (metric.op) {
    case 'gt':
      return value > metric.value
    case 'gte':
      return value >= metric.value
    case 'lt':
      return value < metric.value
    case 'lte':
      return value <= metric.value
    case 'eq':
      return value === metric.value
  }
}

export function matchesFilter(node: OrgTreeNode, filter: StructuredFilter): boolean {
  if (filter.text !== null && !node.name.toLowerCase().includes(filter.text.toLowerCase())) {
    return false
  }
  if (filter.level !== null && node.level + 1 !== filter.level) {
    return false
  }
  if (filter.metric !== null && !matchesMetric(node, filter.metric)) {
    return false
  }
  return true
}

export function computeMatchedIds(tree: OrgTreeNode[], filter: StructuredFilter): Set<string> | null {
  if (isEmptyFilter(filter)) {
    return null
  }

  const matched = new Set<string>()

  const visit = (nodes: OrgTreeNode[]): void => {
    for (const node of nodes) {
      if (matchesFilter(node, filter)) {
        matched.add(node.id)
      }
      visit(node.children)
    }
  }
  visit(tree)

  return matched
}
