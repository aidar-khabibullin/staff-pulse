import type { OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'

export function flattenOrgTree(roots: OrgTreeNode[]): OrgTreeNode[] {
  const result: OrgTreeNode[] = []

  const visit = (node: OrgTreeNode): void => {
    result.push(node)
    for (const child of node.children) {
      visit(child)
    }
  }

  for (const root of roots) {
    visit(root)
  }

  return result
}
