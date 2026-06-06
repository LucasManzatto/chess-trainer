import { useQuery } from '@tanstack/react-query'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'

export function useRepertoireCards(side?: 'white' | 'black') {
  return useQuery({
    queryKey: trainKeys.cards(side),
    queryFn: ({ signal }) => trainApi.listCards(side, signal),
  })
}
