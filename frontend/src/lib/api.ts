import { toast } from 'sonner'

import { API_BASE } from '../config/env'
import { authClient } from './auth'

type AuthSession = { user?: { id?: string } } | null
type ErrorBody = { detail?: string; message?: string } | null

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: session } = await authClient.getSession()
  const userId = (session as AuthSession)?.user?.id ?? ''

  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...init?.headers,
    },
  })

  if (resp.status === 204) return undefined as T

  if (!resp.ok) {
    const body: ErrorBody = await resp.json().catch(() => null)
    const message = body?.detail ?? body?.message ?? resp.statusText
    const err = new Error(message) as Error & { status: number }
    err.status = resp.status

    if (resp.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    } else {
      toast.error(message)
    }

    throw err
  }

  return resp.json()
}
