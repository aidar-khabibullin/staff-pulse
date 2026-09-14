import styles from './AiSearchBar.module.css'

interface AiSearchBarProps {
  value: string
  onChange: (value: string) => void
  usedFallback: boolean
  isActive: boolean
}

export function AiSearchBar({ value, onChange, usedFallback, isActive }: AiSearchBarProps) {
  const mode = !isActive ? 'idle' : usedFallback ? 'fallback' : 'ai'

  return (
    <div className={styles.container}>
      <input
        type="text"
        className={styles.input}
        data-testid="ai-search-input"
        placeholder='AI-поиск: "эффективность выше 80", "уровень 2", "бюджет больше 5000000"…'
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className={styles.mode} data-testid="ai-search-mode" data-mode={mode}>
        {mode === 'ai' && 'AI-фильтр применён'}
        {mode === 'fallback' && 'Запрос не распознан — используется текстовый поиск'}
        {mode === 'idle' && ' '}
      </span>
    </div>
  )
}
