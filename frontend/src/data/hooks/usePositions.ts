import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPositions,
  positionAnnotationArrowsApi,
  positionAnnotationCirclesApi,
  positionCommentsApi,
  positionsApi,
} from '../api'
import { positionsKeys } from '../queryKeys'
import type { Position, PositionDetail } from '../../features/openings/types'

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

export function usePositionAnnotationArrows(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.detail(fen)
  const { data, isLoading } = usePositionDetailQuery(fen)

  const create = useMutation({
    mutationFn: ({ from_square, to_square, color }: { from_square: string; to_square: string; color: string }) =>
      positionAnnotationArrowsApi.create(fen, from_square, to_square, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({ arrowId, color }: { arrowId: number; color: string }) =>
      positionAnnotationArrowsApi.update(arrowId, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (arrowId: number) => positionAnnotationArrowsApi.remove(arrowId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { arrows: data?.arrows ?? emptyDetail.arrows, isLoading, create, update, remove }
}

export function usePositionAnnotationCircles(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.detail(fen)
  const { data, isLoading } = usePositionDetailQuery(fen)

  const create = useMutation({
    mutationFn: ({ square, color }: { square: string; color: string }) =>
      positionAnnotationCirclesApi.create(fen, square, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({ circleId, color }: { circleId: number; color: string }) =>
      positionAnnotationCirclesApi.update(circleId, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (circleId: number) => positionAnnotationCirclesApi.remove(circleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { circles: data?.circles ?? emptyDetail.circles, isLoading, create, update, remove }
}
