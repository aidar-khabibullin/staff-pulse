import { describe, expect, it } from 'vitest'
import { parseNaturalLanguageQuery } from './parseNaturalLanguageQuery'

describe('parseNaturalLanguageQuery', () => {
  it('распознаёт условие по эффективности с оператором "больше"', () => {
    const result = parseNaturalLanguageQuery('эффективность выше 80')
    expect(result.usedFallback).toBe(false)
    expect(result.filter.metric).toEqual({ field: 'performance', op: 'gt', value: 80 })
    expect(result.filter.level).toBeNull()
  })

  it('распознаёт условие по бюджету с числом-разделителем через пробел', () => {
    const result = parseNaturalLanguageQuery('бюджет больше 5 000 000')
    expect(result.usedFallback).toBe(false)
    expect(result.filter.metric).toEqual({ field: 'budget', op: 'gt', value: 5000000 })
  })

  it('распознаёт условие "не менее" как gte', () => {
    const result = parseNaturalLanguageQuery('сотрудников не менее 10')
    expect(result.usedFallback).toBe(false)
    expect(result.filter.metric).toEqual({ field: 'headcount', op: 'gte', value: 10 })
  })

  it('распознаёт числовой уровень', () => {
    const result = parseNaturalLanguageQuery('уровень 2')
    expect(result.usedFallback).toBe(false)
    expect(result.filter.level).toBe(2)
    expect(result.filter.metric).toBeNull()
  })

  it('распознаёт словесный порядковый уровень', () => {
    const result = parseNaturalLanguageQuery('второй уровень')
    expect(result.usedFallback).toBe(false)
    expect(result.filter.level).toBe(2)
  })

  it('падает в fallback на текстовый поиск, если паттерн не распознан', () => {
    const result = parseNaturalLanguageQuery('отдел продаж')
    expect(result.usedFallback).toBe(true)
    expect(result.filter).toEqual({ text: 'отдел продаж', level: null, metric: null })
  })

  it('падает в fallback, если есть ключевое слово метрики, но нет оператора или числа', () => {
    const result = parseNaturalLanguageQuery('какая тут эффективность')
    expect(result.usedFallback).toBe(true)
    expect(result.filter.text).toBe('какая тут эффективность')
  })

  it('пустой запрос не является ни AI-фильтром, ни fallback-поиском', () => {
    const result = parseNaturalLanguageQuery('   ')
    expect(result.usedFallback).toBe(false)
    expect(result.filter).toEqual({ text: null, level: null, metric: null })
  })
})
