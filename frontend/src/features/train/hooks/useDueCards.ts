import { useQuery } from '@tanstack/react-query'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'

export function useDueCards(limit = 20) {
  return useQuery({
    queryKey: trainKeys.due(),
    queryFn: ({ signal }) => trainApi.getDueCards(limit, signal),
  })
}
