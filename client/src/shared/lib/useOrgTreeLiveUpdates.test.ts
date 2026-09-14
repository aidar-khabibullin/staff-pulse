import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOrgTreeLiveUpdates } from './useOrgTreeLiveUpdates'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: MessageEvent<string>) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  closed = false

  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }

  close() {
    this.closed = true
    this.onclose?.()
  }

  triggerOpen() {
    this.onopen?.()
  }

  triggerMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent<string>)
  }
}

describe('useOrgTreeLiveUpdates', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('переходит в статус open и вызывает onPatch при получении сообщения', async () => {
    const onPatch = vi.fn()
    const { result } = renderHook(() => useOrgTreeLiveUpdates(onPatch))

    expect(result.current).toBe('connecting')

    const socket = FakeWebSocket.instances[0]
    socket.triggerOpen()

    await waitFor(() => expect(result.current).toBe('open'))

    socket.triggerMessage({ id: 'div-1', changes: { headcount: 6 }, updatedAt: '2026-01-01T00:00:00.000Z' })

    expect(onPatch).toHaveBeenCalledWith({
      id: 'div-1',
      changes: { headcount: 6 },
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('игнорирует некорректные сообщения', async () => {
    const onPatch = vi.fn()
    renderHook(() => useOrgTreeLiveUpdates(onPatch))

    const socket = FakeWebSocket.instances[0]
    socket.triggerOpen()
    socket.triggerMessage({ foo: 'bar' })

    expect(onPatch).not.toHaveBeenCalled()
  })

  it('переходит в reconnecting после закрытия соединения', async () => {
    const { result } = renderHook(() => useOrgTreeLiveUpdates(() => {}))

    const socket = FakeWebSocket.instances[0]
    socket.triggerOpen()
    await waitFor(() => expect(result.current).toBe('open'))

    socket.close()

    await waitFor(() => expect(result.current).toBe('reconnecting'))
  })
})
