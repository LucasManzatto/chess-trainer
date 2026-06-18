import { request } from '../../../lib/api'
import type { Position, PositionComment } from '../types'

export async function fetchPositions(): Promise<Position[]> {
  const resp = await fetch('/positions.json')
  if (!resp.ok) throw new Error('Failed to load positions')
  return resp.json()
}

export const userPositionsApi = {
  list: (signal?: AbortSignal) =>
    request<Position[]>('/api/v1/positions/mine', { signal }),
  save: (fen: string) =>
    request<Position>('/api/v1/positions/mine', {
      method: 'POST',
      body: JSON.stringify({ fen }),
    }),
  remove: (fen: string) =>
    request<void>(`/api/v1/positions/mine/${encodeURIComponent(fen)}`, { method: 'DELETE' }),
}

export const positionCommentsApi = {
  list: (fen: string, signal?: AbortSignal) =>
    request<PositionComment[]>(`/api/v1/positions/${encodeURIComponent(fen)}/comments`, { signal }),
  create: (fen: string, content: string) =>
    request<PositionComment>(`/api/v1/positions/${encodeURIComponent(fen)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  update: (commentId: number, content: string) =>
    request<PositionComment>(`/api/v1/positions/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  delete: (commentId: number) =>
    request<void>(`/api/v1/positions/comments/${commentId}`, { method: 'DELETE' }),
}
