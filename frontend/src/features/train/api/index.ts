import { request } from '../../../lib/api'
import type { CardCreate, CardDelete, CardReview, CoverageStats, RepertoireCard } from '../types'

export const trainApi = {
  /** List all repertoire cards, optionally filtered by side. */
  listCards: (side?: 'white' | 'black', signal?: AbortSignal) => {
    const params = new URLSearchParams()
    if (side) params.set('side', side)
    const qs = params.size ? `?${params}` : ''
    return request<RepertoireCard[]>(`/api/v1/train/cards${qs}`, { signal })
  },

  /** Upsert a committed move as a card. Idempotent by position_key. */
  commitMove: (card: CardCreate) =>
    request<RepertoireCard>('/api/v1/train/cards', {
      method: 'POST',
      body: JSON.stringify(card),
    }),

  /** Delete a card. position_key is in the body to avoid FEN slash encoding issues. */
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
}
