import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'
import type { CardReview, RepertoireCard } from '../types'

export function useReviewCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (review: CardReview) => trainApi.reviewCard(review),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: trainKeys.all() })
      // Update the card in the cards cache without a full refetch
      queryClient.setQueriesData<RepertoireCard[]>(
        { queryKey: trainKeys.cards() },
        (prev) => prev?.map(c => c.position_key === updated.position_key ? updated : c),
      )
    },
  })
}
