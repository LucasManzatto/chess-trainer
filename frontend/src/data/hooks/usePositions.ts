import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPositions,
  positionAnnotationsApi,
  positionCommentsApi,
  positionsApi,
} from '../api'
import { positionsKeys } from '../queryKeys'
import type { Position, PositionAnnotationArrow, PositionAnnotationCircle, PositionDetail } from '../../features/openings/types'

export function usePositions() {
  return useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: Infinity,
  })
}

const emptyDetail: PositionDetail = { position: null, comments: [], arrows: [], circles: [] }

function usePositionDetailQuery(fen: string) {
  return useQuery({
    queryKey: positionsKeys.detail(fen),
    queryFn: ({ signal }) => positionsApi.getDetail(fen, signal),
    enabled: !!fen,
  })
}

export function usePosition(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.detail(fen)
  const { data, isLoading } = usePositionDetailQuery(fen)

  const upsert = useMutation({
    mutationFn: ({ name, moves }: { name?: string | null; moves?: string[] }) =>
      positionsApi.upsert(fen, name, moves),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: () => positionsApi.remove(fen),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { data: data ?? emptyDetail, isLoading, upsert, remove }
}

export function usePositionComments(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.detail(fen)
  const { data, isLoading } = usePositionDetailQuery(fen)

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

  return { comments: data?.comments ?? emptyDetail.comments, isLoading, add, update, remove }
}

export function usePositionAnnotations(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.detail(fen)

  const replace = useMutation({
    mutationFn: ({
      arrows,
      circles,
    }: {
      arrows: Pick<PositionAnnotationArrow, 'from_square' | 'to_square' | 'color' | 'comment'>[]
      circles: Pick<PositionAnnotationCircle, 'square' | 'color' | 'comment'>[]
    }) => positionAnnotationsApi.replace(fen, arrows, circles),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { replace }
}
