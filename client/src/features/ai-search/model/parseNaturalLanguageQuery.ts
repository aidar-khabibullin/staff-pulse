import type { MetricCondition, MetricField, MetricOperator, StructuredFilter } from './structuredFilter'

const METRIC_KEYWORDS: Array<{ field: MetricField; patterns: string[] }> = [
  { field: 'performance', patterns: ['эффективност', 'производительност'] },
  { field: 'budget', patterns: ['бюджет'] },
  { field: 'headcount', patterns: ['сотрудник', 'численност', 'штат', 'персонал'] },
]

const OPERATOR_KEYWORDS: Array<{ op: MetricOperator; patterns: string[] }> = [
  { op: 'gte', patterns: ['не менее', 'не ниже'] },
  { op: 'lte', patterns: ['не более', 'не выше'] },
  { op: 'gt', patterns: ['больше', 'выше', 'более', 'свыше'] },
  { op: 'lt', patterns: ['меньше', 'ниже', 'менее'] },
  { op: 'eq', patterns: ['равно', 'равна', 'равен', 'ровно'] },
]

const LEVEL_WORD_NUMERALS: Record<string, number> = {
  перв: 1,
  втор: 2,
  трет: 3,
  четверт: 4,
  пят: 5,
}

const NUMBER_PATTERN = /\d[\d\s]*\d|\d/g

function extractNumber(text: string): number | null {
  const matches = text.match(NUMBER_PATTERN)
  if (!matches || matches.length === 0) {
    return null
  }
  const raw = matches[matches.length - 1].replace(/\s+/g, '')
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function extractLevel(normalized: string): number | null {
  const digitMatch = normalized.match(/уровен[ья]\s*(\d+)/)
  if (digitMatch) {
    return Number(digitMatch[1])
  }

  const wordMatch = normalized.match(/(перв|втор|трет|четверт|пят)[а-яё]*\s+уровен[ья]/)
  if (wordMatch) {
    return LEVEL_WORD_NUMERALS[wordMatch[1]] ?? null
  }

  return null
}

function extractMetric(normalized: string): MetricCondition | null {
  const fieldEntry = METRIC_KEYWORDS.find((entry) => entry.patterns.some((pattern) => normalized.includes(pattern)))
  if (!fieldEntry) {
    return null
  }

  const operatorEntry = OPERATOR_KEYWORDS.find((entry) =>
    entry.patterns.some((pattern) => normalized.includes(pattern)),
  )
  if (!operatorEntry) {
    return null
  }

  const value = extractNumber(normalized)
  if (value === null) {
    return null
  }

  return { field: fieldEntry.field, op: operatorEntry.op, value }
}

export interface ParsedQuery {
  filter: StructuredFilter
  usedFallback: boolean
}

/**
 * Детерминированный разбор запроса на естественном языке (без внешнего LLM API —
 * см. ADR про AI-поиск) в структурированный фильтр по уровню/показателям.
 * Если ни один паттерн не распознан — fallback на обычный текстовый поиск по названию.
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const trimmed = query.trim()
  if (trimmed === '') {
    return { filter: { text: null, level: null, metric: null }, usedFallback: false }
  }

  const normalized = trimmed.toLowerCase()
  const level = extractLevel(normalized)
  const metric = extractMetric(normalized)

  if (level !== null || metric !== null) {
    return { filter: { text: null, level, metric }, usedFallback: false }
  }

  return { filter: { text: trimmed, level: null, metric: null }, usedFallback: true }
}
