import { useEffect, useMemo, useState } from 'react'
import type { OrgNode } from '@/shared/api/orgNode'
import { collectAllIds, pruneTree } from '@/features/ai-search/model/pruneTree'
import { buildOrgTree, type OrgTreeNode } from '../model/buildOrgTree'
import {
  Children,
  Empty,
  Node,
  NodeMeta,
  NodeName,
  NodeRow,
  PerformanceDot,
  Toggle,
  ToggleSpacer,
  Tree,
} from './OrgTree.styles'

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
    <Node data-testid="org-tree-node" data-node-id={node.id}>
      <NodeRow data-selected={isSelected}>
        {hasChildren ? (
          <Toggle
            type="button"
            data-testid="org-tree-toggle"
            aria-expanded={isExpanded}
            onClick={() => onToggle(node.id)}
          >
            {isExpanded ? '▾' : '▸'}
          </Toggle>
        ) : (
          <ToggleSpacer aria-hidden="true" />
        )}

        <PerformanceDot
          data-performance={performanceLevel(node.performance)}
          title={`Эффективность: ${node.performance}`}
          aria-hidden="true"
        />

        <NodeName>{node.name}</NodeName>
        <NodeMeta>{node.headcount} сотрудников</NodeMeta>
      </NodeRow>

      {hasChildren && isExpanded && (
        <Children>
          {node.children.map((child) => (
            <OrgTreeItem
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              selectedId={selectedId}
            />
          ))}
        </Children>
      )}
    </Node>
  )
}

interface OrgTreeProps {
  nodes: OrgNode[]
  selectedId?: string | null
  matchedIds?: Set<string> | null
}

export function OrgTree({ nodes, selectedId = null, matchedIds = null }: OrgTreeProps) {
  const fullTree = useMemo(() => buildOrgTree(nodes), [nodes])
  const isFiltering = matchedIds !== null
  const tree = useMemo(
    () => (matchedIds ? pruneTree(fullTree, matchedIds) : fullTree),
    [fullTree, matchedIds],
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    collectDefaultExpanded(fullTree, new Set()),
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

  const visibleExpandedIds = isFiltering ? collectAllIds(tree) : expandedIds

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

  if (isFiltering && tree.length === 0) {
    return <Empty data-testid="org-tree-empty">Ничего не найдено</Empty>
  }

  return (
    <Tree data-testid="org-tree">
      {tree.map((node) => (
        <OrgTreeItem
          key={node.id}
          node={node}
          expandedIds={visibleExpandedIds}
          onToggle={handleToggle}
          selectedId={selectedId}
        />
      ))}
    </Tree>
  )
}
