import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'

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
