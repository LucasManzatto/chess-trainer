import { useQuery } from '@tanstack/react-query'
import { moveStatsApi, type MoveStatsResponse } from '../api'
import { engineKeys } from '../api/queryKeys'

export function useMoveStats(moves: string[]) {
  return useQuery<MoveStatsResponse>({
    queryKey: engineKeys.moveStats(moves),
    queryFn: ({ signal }) => moveStatsApi.get(moves, signal),
    staleTime: 1000 * 60 * 60 * 24 * 30, // mirrors 30-day server cache
  })
}
