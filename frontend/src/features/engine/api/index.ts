import { request } from '../../../lib/api'

export type MoveStat = {
  san: string
  uci: string
  white: number
  draws: number
  black: number
  total: number
  percentage: number
}

export type MoveStatsResponse = {
  moves: MoveStat[]
  total_games: number
}

export const moveStatsApi = {
  get: (moves: string[], signal?: AbortSignal) => {
    const params = moves.length ? `?moves=${moves.join(',')}` : ''
    return request<MoveStatsResponse>(`/api/v1/openings/move-stats${params}`, { signal })
  },
}
