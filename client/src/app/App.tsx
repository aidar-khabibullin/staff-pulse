import { useState } from 'react'
import { OrgTree } from '@/features/org-tree/ui/OrgTree'
import { OrgTable } from '@/features/org-table/ui/OrgTable'
import { useOrgTree } from '@/shared/lib/useOrgTree'
import styles from './App.module.css'

type View = 'tree' | 'table'

export function App() {
  const { status, data, error } = useOrgTree()
  const [view, setView] = useState<View>('tree')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Орг-структура компании</h1>
        <p className={styles.subtitle}>Дивизионы → отделы → команды</p>

        <div className={styles.viewToggle} data-testid="view-toggle" role="group" aria-label="Режим отображения">
          <button
            type="button"
            className={styles.viewToggleButton}
            data-testid="view-toggle-tree"
            aria-pressed={view === 'tree'}
            onClick={() => setView('tree')}
          >
            Дерево
          </button>
          <button
            type="button"
            className={styles.viewToggleButton}
            data-testid="view-toggle-table"
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            Таблица
          </button>
        </div>
      </header>

      {(status === 'loading' || status === 'revalidating') && data === null && (
        <div className={styles.status} data-testid="org-tree-loading">
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.statusText}>Загрузка орг-структуры…</span>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.status} data-testid="org-tree-error">
          <span className={`${styles.statusText} ${styles.statusError}`}>
            Не удалось загрузить данные: {error?.message ?? 'неизвестная ошибка'}
          </span>
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.status} data-testid="org-tree-empty">
          <span className={styles.statusText}>Орг-структура пуста</span>
        </div>
      )}

      {data !== null && data.length > 0 && (
        <div className={styles.layout} data-view={view}>
          <section className={styles.treePanel}>
            <OrgTree nodes={data} selectedId={selectedId} />
          </section>
          <section className={styles.tablePanel}>
            <OrgTable nodes={data} selectedId={selectedId} onSelect={setSelectedId} />
          </section>
        </div>
      )}
    </div>
  )
}
