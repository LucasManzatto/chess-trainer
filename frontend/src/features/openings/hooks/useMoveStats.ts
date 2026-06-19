import { useQuery } from '@tanstack/react-query'
import { moveStatsApi } from '../api'
import { positionsKeys } from '../api/queryKeys'

export function useMoveStats(moves: string[]) {
  return useQuery({
    queryKey: positionsKeys.moveStats(moves),
    queryFn: ({ signal }) => moveStatsApi.get(moves, signal),
  })
}
