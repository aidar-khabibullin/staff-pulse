import type { OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'

/**
 * Оставляет в дереве только узлы из matchedIds и их предков (чтобы путь до совпадения
 * оставался виден), отбрасывая остальные ветки.
 */
export function pruneTree(nodes: OrgTreeNode[], matchedIds: Set<string>): OrgTreeNode[] {
  const result: OrgTreeNode[] = []

  for (const node of nodes) {
    const prunedChildren = pruneTree(node.children, matchedIds)
    if (matchedIds.has(node.id) || prunedChildren.length > 0) {
      result.push({ ...node, children: prunedChildren })
    }
  }

  return result
}

export function collectAllIds(nodes: OrgTreeNode[], acc: Set<string> = new Set()): Set<string> {
  for (const node of nodes) {
    acc.add(node.id)
    collectAllIds(node.children, acc)
  }
  return acc
}
