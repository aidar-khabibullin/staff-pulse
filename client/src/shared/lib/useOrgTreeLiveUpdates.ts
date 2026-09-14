import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '@/shared/api/orgTreeClient'

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

export interface OrgNodePatchMessage {
  id: string
  changes: Record<string, number>
  updatedAt: string
}

const INITIAL_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30000

function toWebSocketUrl(baseUrl: string): string {
  const url = new URL('/ws/org-tree', baseUrl || window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

function isPatchMessage(value: unknown): value is OrgNodePatchMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.changes === 'object' &&
    candidate.changes !== null
  )
}

/**
 * Подключение к WebSocket-каналу live-обновлений орг-структуры с
 * автоматическим переподключением при обрыве (экспоненциальный backoff).
 */
export function useOrgTreeLiveUpdates(onPatch: (patch: OrgNodePatchMessage) => void): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const onPatchRef = useRef(onPatch)
  onPatchRef.current = onPatch

  useEffect(() => {
    let cancelled = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectDelay = INITIAL_RECONNECT_DELAY_MS
    let hasConnectedBefore = false

    const connect = () => {
      if (cancelled) {
        return
      }
      setStatus(hasConnectedBefore ? 'reconnecting' : 'connecting')
      socket = new WebSocket(toWebSocketUrl(API_BASE_URL))

      socket.onopen = () => {
        if (cancelled) {
          return
        }
        hasConnectedBefore = true
        reconnectDelay = INITIAL_RECONNECT_DELAY_MS
        setStatus('open')
      }

      socket.onmessage = (event: MessageEvent<string>) => {
        if (cancelled) {
          return
        }
        try {
          const data: unknown = JSON.parse(event.data)
          if (isPatchMessage(data)) {
            onPatchRef.current(data)
          }
        } catch {
          // некорректное сообщение игнорируется
        }
      }

      socket.onclose = () => {
        if (cancelled) {
          return
        }
        setStatus('reconnecting')
        reconnectTimer = setTimeout(connect, reconnectDelay)
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      setStatus('closed')
      socket?.close()
    }
  }, [])

  return status
}
