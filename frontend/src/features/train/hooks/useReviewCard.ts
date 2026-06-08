import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'
import type { CardReview, RepertoireCard } from '../types'

export function useReviewCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (review: CardReview) => trainApi.reviewCard(review),
    onMutate: async (review) => {
      await queryClient.cancelQueries({ queryKey: trainKeys.all() })
      const prevDue = queryClient.getQueryData<RepertoireCard[]>(trainKeys.due())
      queryClient.setQueryData<RepertoireCard[]>(
        trainKeys.due(),
        (prev) => prev?.filter(c => c.position_key !== review.position_key),
      )
      return { prevDue }
    },
    onError: (_err, _review, ctx) => {
      if (ctx?.prevDue) queryClient.setQueryData(trainKeys.due(), ctx.prevDue)
      toast.error('Failed to save grade')
    },
    onSuccess: (updated) => {
      queryClient.setQueriesData<RepertoireCard[]>(
        { queryKey: trainKeys.cards() },
        (prev) => prev?.map(c => c.position_key === updated.position_key ? updated : c),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trainKeys.all() })
    },
  })
}
