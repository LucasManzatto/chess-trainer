import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { positionCommentsApi } from '../api'
import { openingsKeys } from '../api/queryKeys'

export function usePositionComments(openingId: number, fen: string) {
  const qc = useQueryClient()
  const key = openingsKeys.positionComments(openingId)

  const { data: allComments = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => positionCommentsApi.list(openingId, signal),
  })

  const comments = useMemo(() => allComments.filter(c => c.fen === fen), [allComments, fen])

  const add = useMutation({
    mutationFn: ({ moveIndex, content }: { moveIndex: number; content: string }) =>
      positionCommentsApi.create(openingId, moveIndex, fen, content),
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
