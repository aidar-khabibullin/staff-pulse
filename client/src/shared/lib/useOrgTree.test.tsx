import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearOrgTreeCache, useOrgTree } from './useOrgTree'

describe('useOrgTree', () => {
  beforeEach(() => {
    clearOrgTreeCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('aborts the in-flight request when the component unmounts', async () => {
    let capturedSignal: AbortSignal | undefined
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal
      return new Promise(() => {})
    })
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = renderHook(() => useOrgTree())

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(capturedSignal?.aborted).toBe(false)

    unmount()

    expect(capturedSignal?.aborted).toBe(true)
  })

  it('does not update state after unmount once the request resolves', async () => {
    let resolveFetch: (value: Response) => void = () => {}
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve
    }))
    vi.stubGlobal('fetch', fetchMock)
    const setStateSpy = vi.fn()

    const { result, unmount } = renderHook(() => {
      const state = useOrgTree()
      setStateSpy(state.status)
      return state
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    unmount()

    const callsBeforeResolve = setStateSpy.mock.calls.length
    resolveFetch({
      ok: true,
      json: async () => [],
    } as Response)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(setStateSpy.mock.calls.length).toBe(callsBeforeResolve)
    expect(result.current.status).toBe('loading')
  })
})
