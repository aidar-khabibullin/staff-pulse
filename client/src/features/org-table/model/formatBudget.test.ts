import { describe, expect, it } from 'vitest'
import { formatBudget } from './formatBudget'

describe('formatBudget', () => {
  it('группирует разряды по три цифры и добавляет суффикс "руб."', () => {
    expect(formatBudget(12345678)).toBe('12 345 678 руб.')
  })

  it('не добавляет пробел для чисел короче четырёх цифр', () => {
    expect(formatBudget(999)).toBe('999 руб.')
  })

  it('округляет дробные значения', () => {
    expect(formatBudget(1234.6)).toBe('1 235 руб.')
  })

  it('корректно форматирует ноль', () => {
    expect(formatBudget(0)).toBe('0 руб.')
  })
})
