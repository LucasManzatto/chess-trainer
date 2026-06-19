import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trainApi } from '../api'
import { trainKeys } from '../api/queryKeys'

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (positionId: string) => trainApi.deleteCard({ position_id: positionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainKeys.all() })
    },
  })
}
