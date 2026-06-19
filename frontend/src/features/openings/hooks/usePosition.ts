import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { positionsApi } from '../api'
import { positionsKeys } from '../api/queryKeys'

export function usePosition(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.position(fen)

  const { data: position, isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => positionsApi.get(fen, signal),
    enabled: !!fen,
    retry: false,
    staleTime: 30_000,
  })

  const upsert = useMutation({
    mutationFn: ({ name, moves }: { name?: string | null; moves?: string[] }) =>
      positionsApi.upsert(fen, name, moves),
    onSuccess: (updated) => qc.setQueryData(key, updated),
  })

  const remove = useMutation({
    mutationFn: () => positionsApi.remove(fen),
    onSuccess: () => qc.removeQueries({ queryKey: key }),
  })

  return { position, isLoading, upsert, remove }
}
