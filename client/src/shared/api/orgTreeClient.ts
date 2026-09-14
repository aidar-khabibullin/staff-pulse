import { orgTreeResponseSchema, type OrgNode } from '@/shared/api/orgNode'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export class OrgTreeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrgTreeValidationError'
  }
}

export async function fetchOrgTree(signal?: AbortSignal): Promise<OrgNode[]> {
  const response = await fetch(`${API_BASE_URL}/api/org-tree`, { signal })

  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`)
  }

  const payload: unknown = await response.json()
  const result = orgTreeResponseSchema.safeParse(payload)

  if (!result.success) {
    throw new OrgTreeValidationError(
      `Ответ API не соответствует ожидаемой схеме: ${result.error.message}`,
    )
  }

  return result.data
}
