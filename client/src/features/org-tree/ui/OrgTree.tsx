import { useEffect, useMemo, useRef, useState } from 'react'
import type { OrgNode } from '@/shared/api/orgNode'
import { collectAllIds, pruneTree } from '@/features/ai-search/model/pruneTree'
import { buildOrgTree, type OrgTreeNode } from '../model/buildOrgTree'
import {
  Children,
  Empty,
  EXPAND_ANIMATION_MS,
  Node,
  NodeMeta,
  NodeName,
  NodeRow,
  PerformanceDot,
  Toggle,
  ToggleIcon,
  ToggleSpacer,
  Tree,
  TreeScrollArea,
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
  registerNodeRef: (id: string, element: HTMLDivElement | null) => void
}

function OrgTreeItem({ node, expandedIds, onToggle, selectedId, registerNodeRef }: OrgTreeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = node.id === selectedId

  return (
    <Node data-testid="org-tree-node" data-node-id={node.id}>
      <NodeRow data-selected={isSelected} ref={(element) => registerNodeRef(node.id, element)}>
        {hasChildren ? (
          <Toggle
            type="button"
            data-testid="org-tree-toggle"
            aria-expanded={isExpanded}
            onClick={() => onToggle(node.id)}
          >
            <ToggleIcon aria-hidden="true">▸</ToggleIcon>
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
              registerNodeRef={registerNodeRef}
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
  /**
   * Активный вид ("tree"/"table") из переключателя в шапке. На узких экранах
   * дерево скрывается через CSS (display: none), пока активна "Таблица" —
   * scrollIntoView на скрытом элементе браузер молча игнорирует, поэтому этот
   * проп используется только как сигнал для повторной попытки скролла при
   * переключении обратно на "Дерево" (см. эффект ниже).
   */
  activeView?: 'tree' | 'table'
}

export function OrgTree({ nodes, selectedId = null, matchedIds = null, activeView = 'tree' }: OrgTreeProps) {
  const fullTree = useMemo(() => buildOrgTree(nodes), [nodes])
  const isFiltering = matchedIds !== null
  const tree = useMemo(
    () => (matchedIds ? pruneTree(fullTree, matchedIds) : fullTree),
    [fullTree, matchedIds],
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    collectDefaultExpanded(fullTree, new Set()),
  )
  const nodeElementsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrolledKeyRef = useRef<string | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const registerNodeRef = (id: string, element: HTMLDivElement | null): void => {
    if (element) {
      nodeElementsRef.current.set(id, element)
    } else {
      nodeElementsRef.current.delete(id)
    }
  }

  // Раскрывает предков выбранного узла только при смене самого выбора — не на
  // каждое обновление tree (в т.ч. от live-патчей, которые приходят раз в
  // секунду), иначе вручную свёрнутая ветка тут же разворачивалась бы обратно
  // на следующий патч.
  const treeRef = useRef(tree)
  treeRef.current = tree
  useEffect(() => {
    if (!selectedId) {
      return
    }
    const ancestors = findAncestorIds(treeRef.current, selectedId)
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
  }, [selectedId])

  const visibleExpandedIds = isFiltering ? collectAllIds(tree) : expandedIds

  // Ждём, пока предки выбранного узла раскроются (эффект выше) и он появится в DOM,
  // затем скроллим к нему так, чтобы узел оказался у верхнего края области — иначе
  // при клике по строке таблицы выбор в дереве происходит вне видимой области и
  // незаметен пользователю. Ключ включает activeView, чтобы повторить попытку при
  // переключении с "Таблицы" на "Дерево" на узких экранах (первая попытка на
  // скрытой панели браузером игнорируется).
  useEffect(() => {
    if (!selectedId) {
      scrolledKeyRef.current = null
      return
    }
    const key = `${selectedId}:${activeView}`
    if (scrolledKeyRef.current === key) {
      return
    }
    const element = nodeElementsRef.current.get(selectedId)
    if (!element) {
      return
    }
    // Только что раскрытая ветка ещё анимируется (max-height растёт CSS-анимацией
    // EXPAND_ANIMATION_MS) — если скроллить сразу, позиция считается по неготовому
    // макету и узел не дожимается до верхнего края. Ждём конца анимации.
    scrollTimerRef.current = setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      scrolledKeyRef.current = key
      scrollTimerRef.current = null
    }, EXPAND_ANIMATION_MS + 20)

    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = null
      }
    }
  }, [selectedId, visibleExpandedIds, activeView])

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
    return (
      <TreeScrollArea>
        <Empty data-testid="org-tree-empty">Ничего не найдено</Empty>
      </TreeScrollArea>
    )
  }

  return (
    <TreeScrollArea>
      <Tree data-testid="org-tree">
        {tree.map((node) => (
          <OrgTreeItem
            key={node.id}
            node={node}
            expandedIds={visibleExpandedIds}
            onToggle={handleToggle}
            selectedId={selectedId}
            registerNodeRef={registerNodeRef}
          />
        ))}
      </Tree>
    </TreeScrollArea>
  )
}
