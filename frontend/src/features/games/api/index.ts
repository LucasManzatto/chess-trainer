import { request } from '../../../lib/api'
import type { GamesFilters, GamesListResponse, SyncStatus, UserProfile } from '../types'

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
    if (filters.eco)        params.set('eco', filters.eco)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    return request<GamesListResponse>(`/api/v1/games?${params}`, { signal })
  },
}
