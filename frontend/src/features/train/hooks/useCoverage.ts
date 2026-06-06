import { useQuery } from '@tanstack/react-query'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'

export function useCoverage() {
  return useQuery({
    queryKey: trainKeys.coverage(),
    queryFn: ({ signal }) => trainApi.getCoverage(signal),
  })
}
