export type MetricField = 'headcount' | 'budget' | 'performance'
export type MetricOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq'

export interface MetricCondition {
  field: MetricField
  op: MetricOperator
  value: number
}

export interface StructuredFilter {
  text: string | null
  level: number | null
  metric: MetricCondition | null
}

export function isEmptyFilter(filter: StructuredFilter): boolean {
  return filter.text === null && filter.level === null && filter.metric === null
}
