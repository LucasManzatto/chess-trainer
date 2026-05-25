import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'

export function useMutationWithInvalidation<TVariables, TData = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  queryKey: QueryKey,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })
}
