import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { positionMovesApi } from '../api'
import { positionsKeys } from '../api/queryKeys'

export function usePositionMoves(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.moves(fen)

  const { data: moves = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => positionMovesApi.list(fen, signal),
    enabled: !!fen,
  })

  const create = useMutation({
    mutationFn: (body: Parameters<typeof positionMovesApi.create>[0]) =>
      positionMovesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({ moveId, ...body }: { moveId: string; is_main_line?: boolean; commentary?: string | null }) =>
      positionMovesApi.update(moveId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (moveId: string) => positionMovesApi.remove(moveId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { moves, isLoading, create, update, remove }
}
