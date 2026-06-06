import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'
import type { CardCreate } from '../types'

export function useCommitMove() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (card: CardCreate) => trainApi.commitMove(card),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainKeys.all() })
    },
  })
}
