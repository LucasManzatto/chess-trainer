import { request } from '../../../lib/api'
import type { OpeningComment, PositionComment, DrillQueueItem, DrillGrade, FavoriteToggleResponse, DrillActionResponse, Opening } from '../types'

export async function fetchOpenings(): Promise<Opening[]> {
  const resp = await fetch('/openings.json')
  if (!resp.ok) throw new Error('Failed to load openings')
  return resp.json()
}

// Opening comments
export const openingCommentsApi = {
  list: (openingId: number, signal?: AbortSignal) =>
    request<OpeningComment[]>(`/api/v1/openings/${openingId}/comments`, { signal }),
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
  list: (openingId: number, signal?: AbortSignal) =>
    request<PositionComment[]>(`/api/v1/openings/${openingId}/position-comments`, { signal }),
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
  list: (signal?: AbortSignal) =>
    request<number[]>('/api/v1/openings/favorites', { signal }),
  toggle: (openingId: number) =>
    request<FavoriteToggleResponse>(`/api/v1/openings/${openingId}/favorite`, {
      method: 'POST',
    }),
}

// Drill
export const drillApi = {
  queue: (signal?: AbortSignal) =>
    request<DrillQueueItem[]>('/api/v1/openings/drill/queue', { signal }),
  addToDrill: (openingId: number) =>
    request<DrillActionResponse>(`/api/v1/openings/${openingId}/drill`, {
      method: 'POST',
    }),
  review: (openingId: number, grade: DrillGrade) =>
    request<DrillActionResponse>(`/api/v1/openings/${openingId}/review`, {
      method: 'POST',
      body: JSON.stringify({ grade }),
    }),
}
