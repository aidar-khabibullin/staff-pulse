import { describe, expect, it } from 'vitest'
import type { OrgNode } from '@/shared/api/orgNode'
import { buildOrgTree } from '@/features/org-tree/model/buildOrgTree'
import { aggregateOrgTree } from '@/features/org-table/model/aggregateOrgTree'
import { computeMatchedIds, computeMatchedIdsByAggregate } from './applyStructuredFilter'

const NODES: OrgNode[] = [
  { id: 'd1', name: 'Дивизион продаж', parentId: null, headcount: 100, budget: 10_000_000, performance: 70, updatedAt: '2026-01-01' },
  { id: 't1', name: 'Отдел развития', parentId: 'd1', headcount: 20, budget: 2_000_000, performance: 90, updatedAt: '2026-01-01' },
  { id: 't2', name: 'Отдел поддержки', parentId: 'd1', headcount: 15, budget: 1_000_000, performance: 40, updatedAt: '2026-01-01' },
]

describe('computeMatchedIds', () => {
  it('возвращает null для пустого фильтра (поиск неактивен)', () => {
    const tree = buildOrgTree(NODES)
    expect(computeMatchedIds(tree, { text: null, level: null, metric: null })).toBeNull()
  })

  it('фильтрует по метрике performance', () => {
    const tree = buildOrgTree(NODES)
    const result = computeMatchedIds(tree, {
      text: null,
      level: null,
      metric: { field: 'performance', op: 'gt', value: 80 },
    })
    expect(result).toEqual(new Set(['t1']))
  })

  it('фильтрует по уровню (1-индексация как в таблице)', () => {
    const tree = buildOrgTree(NODES)
    const result = computeMatchedIds(tree, { text: null, level: 1, metric: null })
    expect(result).toEqual(new Set(['d1']))
  })

  it('fallback-текст фильтрует по названию узла без учёта регистра', () => {
    const tree = buildOrgTree(NODES)
    const result = computeMatchedIds(tree, { text: 'поддержки', level: null, metric: null })
    expect(result).toEqual(new Set(['t2']))
  })
})

describe('computeMatchedIdsByAggregate', () => {
  // d1 сам по себе неэффективен (performance: 30), но у него один дочерний узел
  // с performance: 90 и большим headcount, из-за чего взвешенная по потомкам
  // agregate.avgPerformance (то, что реально показывает колонка "Средняя
  // эффективность" в таблице) получается высокой — 84, а не низкой.
  const NODES_WITH_DIVERGING_AGGREGATE: OrgNode[] = [
    { id: 'd1', name: 'Дивизион', parentId: null, headcount: 10, budget: 1_000_000, performance: 30, updatedAt: '2026-01-01' },
    { id: 'c1', name: 'Команда роста', parentId: 'd1', headcount: 90, budget: 5_000_000, performance: 90, updatedAt: '2026-01-01' },
  ]

  it('сверяется с агрегированным (не сырым) значением метрики — не совпадает с отображаемым в таблице числом', () => {
    const tree = buildOrgTree(NODES_WITH_DIVERGING_AGGREGATE)
    const aggregates = aggregateOrgTree(tree)
    const filter = { text: null, level: null, metric: { field: 'performance' as const, op: 'lt' as const, value: 40 } }

    // Раскрывает расхождение: фильтрация по сырому полю (computeMatchedIds) считает,
    // что d1 подходит под "эффективность ниже 40" (его собственное значение — 30),
    // хотя в таблице у d1 показано агрегированное значение 84.
    expect(computeMatchedIds(tree, filter)).toEqual(new Set(['d1']))

    // Фильтрация по агрегату — корректная для таблицы: d1 не попадает в результат,
    // потому что реально отображаемое значение (84) не ниже 40.
    expect(computeMatchedIdsByAggregate(tree, aggregates, filter)).toEqual(new Set())
  })

  it('возвращает null для пустого фильтра', () => {
    const tree = buildOrgTree(NODES)
    const aggregates = aggregateOrgTree(tree)
    expect(computeMatchedIdsByAggregate(tree, aggregates, { text: null, level: null, metric: null })).toBeNull()
  })
})
