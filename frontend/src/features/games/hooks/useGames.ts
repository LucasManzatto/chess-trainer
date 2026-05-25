import { useQuery } from '@tanstack/react-query'
import { gamesApi } from '../api'
import { gamesKeys } from '../api/queryKeys'
import type { GamesFilters, GamesListResponse } from '../types'

export function useGames(filters: GamesFilters) {
  return useQuery<GamesListResponse>({
    queryKey: gamesKeys.list(filters),
    queryFn: ({ signal }) => gamesApi.list(filters, 50, 0, signal),
  })
}
