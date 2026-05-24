import type { OpeningComment, PositionComment, DrillQueueItem, DrillGrade } from '../types'

import { API_BASE } from '../../../config/env'
import { authClient } from '../../../lib/auth'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: session } = await authClient.getSession()
  const userId = (session as { user?: { id?: string } } | null)?.user?.id ?? ''

  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...init?.headers,
    },
  })
  if (resp.status === 204) return undefined as T
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
  return resp.json()
}

// Opening comments
export const openingCommentsApi = {
  list: (openingId: number) =>
    request<OpeningComment[]>(`/api/v1/openings/${openingId}/comments`),
  create: (openingId: number, content: string) =>
    request<OpeningComment>(`/api/v1/openings/${openingId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  update: (commentId: number, content: string) =>
    request<OpeningComment>(`/api/v1/openings/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  delete: (commentId: number) =>
    request<void>(`/api/v1/openings/comments/${commentId}`, { method: 'DELETE' }),
}

// Position comments
export const positionCommentsApi = {
  list: (openingId: number) =>
    request<PositionComment[]>(`/api/v1/openings/${openingId}/position-comments`),
  create: (openingId: number, moveIndex: number, fen: string, content: string) =>
    request<PositionComment>(`/api/v1/openings/${openingId}/position-comments`, {
      method: 'POST',
      body: JSON.stringify({ move_index: moveIndex, fen, content }),
    }),
  update: (commentId: number, content: string) =>
    request<PositionComment>(`/api/v1/openings/position-comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  delete: (commentId: number) =>
    request<void>(`/api/v1/openings/position-comments/${commentId}`, { method: 'DELETE' }),
}

// Favorites
export const openingFavoritesApi = {
  list: () => request<number[]>('/api/v1/openings/favorites'),
  toggle: (openingId: number) =>
    request<{ opening_id: number; is_favorite: boolean }>(`/api/v1/openings/${openingId}/favorite`, {
      method: 'POST',
    }),
}

// Drill
export const drillApi = {
  queue: () => request<DrillQueueItem[]>('/api/v1/openings/drill/queue'),
  addToDrill: (openingId: number) =>
    request<{ opening_id: number; due_date: string }>(`/api/v1/openings/${openingId}/drill`, {
      method: 'POST',
    }),
  review: (openingId: number, grade: DrillGrade) =>
    request<{ opening_id: number; due_date: string }>(`/api/v1/openings/${openingId}/review`, {
      method: 'POST',
      body: JSON.stringify({ grade }),
    }),
}
