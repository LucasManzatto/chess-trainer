import { request } from '../../../lib/api'
import type { MoveStatsResponse, Position, PositionComment, PositionMove, PositionMoveCreateBody } from '../types'

export async function fetchPositions(): Promise<Position[]> {
  const resp = await fetch('/positions.json')
  if (!resp.ok) throw new Error('Failed to load positions')
  return resp.json()
}

export const positionsApi = {
  upsert: (fen: string, name?: string | null, moves?: string[]) =>
    request<Position>('/api/v1/positions', {
      method: 'POST',
      body: JSON.stringify({ fen, name: name ?? null, moves: moves ?? [] }),
    }),
  get: (fen: string, signal?: AbortSignal) =>
    request<Position>(`/api/v1/positions/${encodeURIComponent(fen)}`, { signal }),
  remove: (fen: string) =>
    request<void>(`/api/v1/positions/${encodeURIComponent(fen)}`, { method: 'DELETE' }),
}

export const positionMovesApi = {
  list: (fen: string, signal?: AbortSignal) =>
    request<PositionMove[]>(`/api/v1/positions/${encodeURIComponent(fen)}/moves`, { signal }),
  create: (body: PositionMoveCreateBody) =>
    request<PositionMove>('/api/v1/positions/moves', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (moveId: string, body: { is_main_line?: boolean; commentary?: string | null }) =>
    request<PositionMove>(`/api/v1/positions/moves/${moveId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  remove: (moveId: string) =>
    request<void>(`/api/v1/positions/moves/${moveId}`, { method: 'DELETE' }),
}

export const moveStatsApi = {
  get: (moves: string[], signal?: AbortSignal) =>
    request<MoveStatsResponse>(`/api/v1/positions/move-stats?moves=${encodeURIComponent(moves.join(','))}`, { signal }),
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
