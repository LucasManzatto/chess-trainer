import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openingCommentsApi } from '../api'
import { openingsKeys } from '../api/queryKeys'

export function useOpeningComments(openingId: number) {
  const qc = useQueryClient()
  const key = openingsKeys.comments(openingId)

  const { data: comments = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => openingCommentsApi.list(openingId, signal),
  })

  const add = useMutation({
    mutationFn: (content: string) => openingCommentsApi.create(openingId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      openingCommentsApi.update(commentId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (commentId: number) => openingCommentsApi.delete(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { comments, isLoading, add, update, remove }
}
