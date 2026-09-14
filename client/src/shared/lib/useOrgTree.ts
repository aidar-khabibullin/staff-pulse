import { useEffect, useState } from 'react'
import { fetchOrgTree } from '@/shared/api/orgTreeClient'
import type { OrgNode } from '@/shared/api/orgNode'

const STALE_TIME_MS = 5000
const CACHE_KEY = 'org-tree'

interface CacheEntry {
  data: OrgNode[]
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()

export type OrgTreeStatus = 'loading' | 'revalidating' | 'success' | 'empty' | 'error'

export interface OrgTreeState {
  status: OrgTreeStatus
  data: OrgNode[] | null
  error: Error | null
}

function statusForData(data: OrgNode[]): OrgTreeStatus {
  return data.length === 0 ? 'empty' : 'success'
}

export function useOrgTree(): OrgTreeState {
  const cached = cache.get(CACHE_KEY)
  const [state, setState] = useState<OrgTreeState>(() =>
    cached
      ? { status: statusForData(cached.data), data: cached.data, error: null }
      : { status: 'loading', data: null, error: null },
  )

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const entry = cache.get(CACHE_KEY)
    const isFresh = entry !== undefined && Date.now() - entry.fetchedAt < STALE_TIME_MS

    if (entry) {
      setState({ status: statusForData(entry.data), data: entry.data, error: null })
    }

    if (!isFresh) {
      setState((prev) =>
        prev.data
          ? { ...prev, status: 'revalidating' }
          : { status: 'loading', data: null, error: null },
      )

      fetchOrgTree(controller.signal)
        .then((data) => {
          cache.set(CACHE_KEY, { data, fetchedAt: Date.now() })
          if (!cancelled) {
            setState({ status: statusForData(data), data, error: null })
          }
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || cancelled) {
            return
          }
          const previous = cache.get(CACHE_KEY)
          setState({
            status: 'error',
            data: previous?.data ?? null,
            error: error instanceof Error ? error : new Error(String(error)),
          })
        })
    }

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return state
}

export function clearOrgTreeCache(): void {
  cache.delete(CACHE_KEY)
}
