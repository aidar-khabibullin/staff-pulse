import type { OrgNode } from '@/shared/api/orgNode'

export interface OrgTreeNode extends OrgNode {
  children: OrgTreeNode[]
  level: number
}

/**
 * Кэш по ссылке на исходный массив: App, OrgTree и OrgTable строят дерево из
 * одного и того же `nodes`, поэтому без кэша дерево пересобирается 3 раза на
 * каждое обновление данных (в т.ч. на каждый live-патч).
 */
const treeCache = new WeakMap<OrgNode[], OrgTreeNode[]>()

export function buildOrgTree(nodes: OrgNode[]): OrgTreeNode[] {
  const cached = treeCache.get(nodes)
  if (cached) {
    return cached
  }

  const tree = buildOrgTreeUncached(nodes)
  treeCache.set(nodes, tree)
  return tree
}

function buildOrgTreeUncached(nodes: OrgNode[]): OrgTreeNode[] {
  const byId = new Map<string, OrgTreeNode>()

  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [], level: 0 })
  }

  const roots: OrgTreeNode[] = []

  for (const node of nodes) {
    const treeNode = byId.get(node.id)!
    if (node.parentId === null) {
      roots.push(treeNode)
      continue
    }

    const parent = byId.get(node.parentId)
    if (parent) {
      parent.children.push(treeNode)
    } else {
      roots.push(treeNode)
    }
  }

  const assignLevels = (list: OrgTreeNode[], level: number): void => {
    for (const node of list) {
      node.level = level
      assignLevels(node.children, level + 1)
    }
  }
  assignLevels(roots, 0)

  return roots
}
