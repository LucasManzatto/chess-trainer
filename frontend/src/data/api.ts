import { request } from '../lib/api'
import type { AnalyzeStatusResponse, Game, GameAnalysis, GamesFilters, GamesListResponse, SyncStatus, UserProfile } from '../features/games/types'
import type {
  Position,
  PositionAnnotationArrow,
  PositionAnnotationCircle,
  PositionComment,
  PositionDetail,
} from '../features/openings/types'
import type { CardCreate, CardDelete, CardReview, CoverageStats, RepertoireCard, TrainStats } from '../features/train/types'

export const profileApi = {
  get: (signal?: AbortSignal) =>
    request<UserProfile>('/api/v1/users/profile', { signal }),
  update: (chess_com_username: string) =>
    request<UserProfile>('/api/v1/users/profile', {
      method: 'PATCH',
      body: JSON.stringify({ chess_com_username }),
    }),
}

export const syncApi = {
  trigger: () =>
    request<{ detail: string }>('/api/v1/games/sync', { method: 'POST' }),
  status: (signal?: AbortSignal) =>
    request<SyncStatus>('/api/v1/games/sync/status', { signal }),
}

export const gamesApi = {
  list: (filters: GamesFilters, limit = 50, offset = 0, signal?: AbortSignal) => {
    const params = new URLSearchParams()
    if (filters.result)     params.set('result', filters.result)
    if (filters.color)      params.set('color', filters.color)
    if (filters.time_class) params.set('time_class', filters.time_class)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    return request<GamesListResponse>(`/api/v1/games?${params}`, { signal })
  },
  saveAnalysis: (gameId: number, analysis: GameAnalysis) =>
    request<Game>(`/api/v1/games/${gameId}/analysis`, {
      method: 'PUT',
      body: JSON.stringify({ ...analysis, analyzed_at: analysis.analyzed_at }),
    }),
  analyze: (gameId: number, depth = 18) =>
    request<{ detail: string }>(`/api/v1/games/${gameId}/analyze?depth=${depth}`, { method: 'POST' }),
  analyzeStatus: (gameId: number, signal?: AbortSignal) =>
    request<AnalyzeStatusResponse>(`/api/v1/games/${gameId}/analyze/status`, { signal }),
}

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
  getDetail: (fen: string, signal?: AbortSignal) =>
    request<PositionDetail>(`/api/v1/positions/${encodeURIComponent(fen)}/detail`, { signal }),
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

export const positionAnnotationsApi = {
  replace: (
    fen: string,
    arrows: Pick<PositionAnnotationArrow, 'from_square' | 'to_square' | 'color' | 'comment'>[],
    circles: Pick<PositionAnnotationCircle, 'square' | 'color' | 'comment'>[],
  ) =>
    request<{ arrows: PositionAnnotationArrow[]; circles: PositionAnnotationCircle[] }>(
      `/api/v1/positions/${encodeURIComponent(fen)}/annotations`,
      { method: 'PUT', body: JSON.stringify({ arrows, circles }) },
    ),
}

export const trainApi = {
  /** List all repertoire cards, optionally filtered by side. */
  listCards: (side?: 'white' | 'black', signal?: AbortSignal) => {
    const params = new URLSearchParams()
    if (side) params.set('side', side)
    const qs = params.size ? `?${params}` : ''
    return request<RepertoireCard[]>(`/api/v1/train/cards${qs}`, { signal })
  },

  /** Upsert a card. Idempotent by position (fen). */
  commitMove: (card: CardCreate) =>
    request<RepertoireCard>('/api/v1/train/cards', {
      method: 'POST',
      body: JSON.stringify(card),
    }),

  /** Delete a card by position_id. */
  deleteCard: (body: CardDelete) =>
    request<void>('/api/v1/train/cards', {
      method: 'DELETE',
      body: JSON.stringify(body),
    }),

  /** Cards due for review today, ordered by interval ASC then due ASC. */
  getDueCards: (limit = 20, signal?: AbortSignal) =>
    request<RepertoireCard[]>(`/api/v1/train/cards/due?limit=${limit}`, { signal }),

  /** Submit a grade (0–5) for a card. Returns the updated card. */
  reviewCard: (body: CardReview) =>
    request<RepertoireCard>('/api/v1/train/cards/review', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Count of committed cards per side. */
  getCoverage: (signal?: AbortSignal) =>
    request<CoverageStats>('/api/v1/train/coverage', { signal }),

  /** Reset all cards to initial SRS state (ease 2.5, due now, state "new"). */
  resetCards: () =>
    request<void>('/api/v1/train/cards/reset', { method: 'POST' }),

  /** SRS stats: totals by state + due count. */
  getStats: (signal?: AbortSignal) =>
    request<TrainStats>('/api/v1/train/stats', { signal }),
}
