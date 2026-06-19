import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { positionCommentsApi } from '../api'
import { positionsKeys } from '../api/queryKeys'

export function usePositionComments(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.comments(fen)

  const { data: comments = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => positionCommentsApi.list(fen, signal),
    enabled: !!fen,
  })

  const add = useMutation({
    mutationFn: (content: string) => positionCommentsApi.create(fen, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      positionCommentsApi.update(commentId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (commentId: number) => positionCommentsApi.delete(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { comments, isLoading, add, update, remove }
}
