import { useEffect, useMemo, useState } from 'react'
import type { OrgNode } from '@/shared/api/orgNode'
import { buildOrgTree, type OrgTreeNode } from '../model/buildOrgTree'
import styles from './OrgTree.module.css'

const DEFAULT_EXPANDED_LEVEL = 0

function collectDefaultExpanded(nodes: OrgTreeNode[], acc: Set<string>): Set<string> {
  for (const node of nodes) {
    if (node.level === DEFAULT_EXPANDED_LEVEL && node.children.length > 0) {
      acc.add(node.id)
    }
    collectDefaultExpanded(node.children, acc)
  }
  return acc
}

function findAncestorIds(nodes: OrgTreeNode[], targetId: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return path
    }
    const found = findAncestorIds(node.children, targetId, [...path, node.id])
    if (found) {
      return found
    }
  }
  return null
}

function performanceLevel(performance: number): 'high' | 'medium' | 'low' {
  if (performance >= 80) return 'high'
  if (performance >= 50) return 'medium'
  return 'low'
}

interface OrgTreeItemProps {
  node: OrgTreeNode
  expandedIds: Set<string>
  onToggle: (id: string) => void
  selectedId?: string | null
}

function OrgTreeItem({ node, expandedIds, onToggle, selectedId }: OrgTreeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = node.id === selectedId

  return (
    <li className={styles.node} data-testid="org-tree-node" data-node-id={node.id}>
      <div className={styles.nodeRow} data-selected={isSelected}>
        {hasChildren ? (
          <button
            type="button"
            className={styles.toggle}
            data-testid="org-tree-toggle"
            aria-expanded={isExpanded}
            onClick={() => onToggle(node.id)}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className={styles.toggleSpacer} aria-hidden="true" />
        )}

        <span
          className={styles.performanceDot}
          data-performance={performanceLevel(node.performance)}
          title={`Эффективность: ${node.performance}`}
          aria-hidden="true"
        />

        <span className={styles.nodeName}>{node.name}</span>
        <span className={styles.nodeMeta}>{node.headcount} сотрудников</span>
      </div>

      {hasChildren && isExpanded && (
        <ul className={`${styles.children} ${styles.childrenAnimated}`}>
          {node.children.map((child) => (
            <OrgTreeItem
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

interface OrgTreeProps {
  nodes: OrgNode[]
  selectedId?: string | null
}

export function OrgTree({ nodes, selectedId = null }: OrgTreeProps) {
  const tree = useMemo(() => buildOrgTree(nodes), [nodes])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    collectDefaultExpanded(tree, new Set()),
  )

  useEffect(() => {
    if (!selectedId) {
      return
    }
    const ancestors = findAncestorIds(tree, selectedId)
    if (!ancestors || ancestors.length === 0) {
      return
    }
    setExpandedIds((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const ancestorId of ancestors) {
        if (!next.has(ancestorId)) {
          next.add(ancestorId)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [selectedId, tree])

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <ul className={styles.tree} data-testid="org-tree">
      {tree.map((node) => (
        <OrgTreeItem
          key={node.id}
          node={node}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          selectedId={selectedId}
        />
      ))}
    </ul>
  )
}
