import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openingCommentsApi } from './api'
import { useAuthSession } from './useAuthSession'
import type { OpeningComment } from './types'

export function useOpeningComments(openingId: number) {
  const session = useAuthSession()
  const qc = useQueryClient()
  const queryKey = ['opening-comments', openingId]

  const { data: comments = [] } = useQuery<OpeningComment[]>({
    queryKey,
    queryFn: () => openingCommentsApi.list(openingId),
    enabled: !!session,
  })

  const createMutation = useMutation({
    mutationFn: (content: string) => openingCommentsApi.create(openingId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => openingCommentsApi.update(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => openingCommentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  return { comments, createMutation, updateMutation, deleteMutation }
}
