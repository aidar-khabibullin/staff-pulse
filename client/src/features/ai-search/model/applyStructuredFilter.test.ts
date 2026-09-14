import { describe, expect, it } from 'vitest'
import type { OrgNode } from '@/shared/api/orgNode'
import { buildOrgTree } from '@/features/org-tree/model/buildOrgTree'
import { computeMatchedIds } from './applyStructuredFilter'

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
