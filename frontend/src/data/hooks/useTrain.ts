import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trainApi } from '../api'
import { trainKeys } from '../queryKeys'
import type { CardCreate, CardReview, RepertoireCard } from '../../features/train/types'

export function useCommitMove() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (card: CardCreate) => trainApi.commitMove(card),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainKeys.all() })
    },
  })
}

export function useCoverage() {
  return useQuery({
    queryKey: trainKeys.coverage(),
    queryFn: ({ signal }) => trainApi.getCoverage(signal),
  })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (positionId: string) => trainApi.deleteCard({ position_id: positionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainKeys.all() })
    },
  })
}

export function useDueCards(limit = 20) {
  return useQuery({
    queryKey: trainKeys.due(),
    queryFn: ({ signal }) => trainApi.getDueCards(limit, signal),
  })
}

export function useRepertoireCards(side?: 'white' | 'black') {
  return useQuery({
    queryKey: trainKeys.cards(side),
    queryFn: ({ signal }) => trainApi.listCards(side, signal),
  })
}

export function useResetCards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => trainApi.resetCards(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainKeys.all() })
      toast.success('All cards reset')
    },
    onError: () => {
      toast.error('Failed to reset cards')
    },
  })
}

export function useReviewCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (review: CardReview) => trainApi.reviewCard(review),
    onMutate: async (review) => {
      await queryClient.cancelQueries({ queryKey: trainKeys.all() })
      const prevDue = queryClient.getQueryData<RepertoireCard[]>(trainKeys.due())
      queryClient.setQueryData<RepertoireCard[]>(
        trainKeys.due(),
        (prev) => prev?.filter(c => c.position_id !== review.position_id),
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
        (prev) => prev?.map(c => c.position_id === updated.position_id ? updated : c),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trainKeys.all() })
    },
  })
}

export function useStats() {
  return useQuery({
    queryKey: trainKeys.stats(),
    queryFn: ({ signal }) => trainApi.getStats(signal),
  })
}
