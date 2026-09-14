import { useMemo, useRef } from 'react'
import type { OrgTreeNode } from '@/features/org-tree/model/buildOrgTree'
import { aggregateOrgTree, recalcAggregatesForPatch, type OrgAggregateMap } from './aggregateOrgTree'
import { flattenOrgTree } from './flattenOrgTree'

export interface PatchEvent {
  nodeId: string
  /** Монотонно растущий номер события — отличает повторные патчи одного узла. */
  seq: number
}

/**
 * Агрегаты по дереву с частичным пересчётом: если набор id узлов не
 * поменялся и известен id только что изменённого узла, пересчитывается
 * только путь "узел -> корень" вместо полного обхода дерева.
 */
export function useIncrementalAggregates(tree: OrgTreeNode[], patch: PatchEvent | null): OrgAggregateMap {
  const previousRef = useRef<OrgAggregateMap | null>(null)
  const previousIdsRef = useRef<Set<string>>(new Set())
  const previousSeqRef = useRef<number | null>(null)

  return useMemo(() => {
    const currentIds = new Set(flattenOrgTree(tree).map((node) => node.id))
    const sameIds =
      previousRef.current !== null &&
      currentIds.size === previousIdsRef.current.size &&
      [...currentIds].every((id) => previousIdsRef.current.has(id))

    let next: OrgAggregateMap
    if (!sameIds || previousRef.current === null) {
      next = aggregateOrgTree(tree)
    } else if (patch !== null && patch.seq !== previousSeqRef.current) {
      next = recalcAggregatesForPatch(tree, previousRef.current, patch.nodeId)
    } else {
      next = previousRef.current
    }

    previousRef.current = next
    previousIdsRef.current = currentIds
    previousSeqRef.current = patch?.seq ?? previousSeqRef.current
    return next
  }, [tree, patch])
}
