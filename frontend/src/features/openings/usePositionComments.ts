import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { positionCommentsApi } from './api'
import { useAuthSession } from './useAuthSession'
import type { PositionComment } from './types'

export function usePositionComments(openingId: number, moveIndex: number, fen: string) {
  const session = useAuthSession()
  const qc = useQueryClient()
  const queryKey = ['position-comments', openingId]

  const { data: allComments = [] } = useQuery<PositionComment[]>({
    queryKey,
    queryFn: () => positionCommentsApi.list(openingId),
    enabled: !!session,
  })

  const thisComment = allComments.find(c => c.move_index === moveIndex) ?? null
  const hasComment = !!thisComment

  const createMutation = useMutation({
    mutationFn: (content: string) => positionCommentsApi.create(openingId, moveIndex, fen, content),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => positionCommentsApi.update(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => positionCommentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  return { thisComment, hasComment, createMutation, updateMutation, deleteMutation }
}
