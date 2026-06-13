import { useQuery } from '@tanstack/react-query'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'

export function useStats() {
  return useQuery({
    queryKey: trainKeys.stats(),
    queryFn: ({ signal }) => trainApi.getStats(signal),
  })
}
