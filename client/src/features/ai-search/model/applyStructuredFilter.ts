import type { OrgNode } from '@/shared/api/orgNode'
import type { OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'
import type { OrgAggregate, OrgAggregateMap } from '@/features/org-table/model/aggregateOrgTree'
import type { MetricCondition, StructuredFilter } from './structuredFilter'
import { isEmptyFilter } from './structuredFilter'

function compareByOperator(value: number, metric: MetricCondition): boolean {
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

function matchesMetric(node: OrgNode, metric: MetricCondition): boolean {
  return compareByOperator(node[metric.field], metric)
}

function matchesTextAndLevel(node: OrgTreeNode, filter: StructuredFilter): boolean {
  if (filter.text !== null && !node.name.toLowerCase().includes(filter.text.toLowerCase())) {
    return false
  }
  if (filter.level !== null && node.level + 1 !== filter.level) {
    return false
  }
  return true
}

/** Сопоставление с собственным (не агрегированным) значением метрики узла — используется деревом, которое показывает performance/headcount самого узла, а не потомков. */
export function matchesFilter(node: OrgTreeNode, filter: StructuredFilter): boolean {
  if (!matchesTextAndLevel(node, filter)) {
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

function aggregateMetricValue(aggregate: OrgAggregate, field: MetricCondition['field']): number {
  switch (field) {
    case 'headcount':
      return aggregate.totalHeadcount
    case 'budget':
      return aggregate.totalBudget
    case 'performance':
      return aggregate.avgPerformance
  }
}

/**
 * Сопоставление с агрегированным по потомкам значением метрики (totalHeadcount/
 * totalBudget/avgPerformance) — именно эти значения показывает таблица в колонках
 * «Всего сотрудников»/«Бюджет суммарный»/«Средняя эффективность», поэтому фильтр
 * таблицы должен сверяться с ними, а не с сырым полем узла (иначе строка может
 * остаться в результатах фильтра, хотя отображаемое агрегированное число условию
 * не удовлетворяет).
 */
function matchesAggregateFilter(node: OrgTreeNode, aggregate: OrgAggregate, filter: StructuredFilter): boolean {
  if (!matchesTextAndLevel(node, filter)) {
    return false
  }
  if (filter.metric !== null && !compareByOperator(aggregateMetricValue(aggregate, filter.metric.field), filter.metric)) {
    return false
  }
  return true
}

export function computeMatchedIdsByAggregate(
  tree: OrgTreeNode[],
  aggregates: OrgAggregateMap,
  filter: StructuredFilter,
): Set<string> | null {
  if (isEmptyFilter(filter)) {
    return null
  }

  const matched = new Set<string>()

  const visit = (nodes: OrgTreeNode[]): void => {
    for (const node of nodes) {
      const aggregate = aggregates.get(node.id)
      if (aggregate && matchesAggregateFilter(node, aggregate, filter)) {
        matched.add(node.id)
      }
      visit(node.children)
    }
  }
  visit(tree)

  return matched
}
