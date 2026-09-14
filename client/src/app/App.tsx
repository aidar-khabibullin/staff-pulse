import { useOrgTree } from '@/shared/lib/useOrgTree'
import styles from './App.module.css'

export function App() {
  const { status, data, error } = useOrgTree()

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Орг-структура компании</h1>
        <p className={styles.subtitle}>Дивизионы → отделы → команды</p>
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
        <ul className={styles.nodeList} data-testid="org-tree-list">
          {data.map((node) => (
            <li key={node.id} className={styles.nodeRow}>
              <span className={styles.nodeName}>{node.name}</span>
              <span className={styles.nodeMeta}>{node.headcount} сотрудников</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
