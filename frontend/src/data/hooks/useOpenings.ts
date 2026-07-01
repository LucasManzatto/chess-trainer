import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPositions,
  moveStatsApi,
  positionAnnotationArrowsApi,
  positionAnnotationCirclesApi,
  positionCommentsApi,
  positionMovesApi,
  positionsApi,
} from '../api'
import { positionsKeys } from '../queryKeys'
import type { Position } from '../../features/openings/types'

export function useOpenings() {
  return useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: Infinity,
  })
}

export function useMoveStats(moves: string[]) {
  return useQuery({
    queryKey: positionsKeys.moveStats(moves),
    queryFn: ({ signal }) => moveStatsApi.get(moves, signal),
  })
}

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

export function usePositionAnnotationArrows(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.annotationArrows(fen)

  const { data: arrows = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => positionAnnotationArrowsApi.list(fen, signal),
    enabled: !!fen,
  })

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

  return { arrows, isLoading, create, update, remove }
}

export function usePositionAnnotationCircles(fen: string) {
  const qc = useQueryClient()
  const key = positionsKeys.annotationCircles(fen)

  const { data: circles = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => positionAnnotationCirclesApi.list(fen, signal),
    enabled: !!fen,
  })

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

  return { circles, isLoading, create, update, remove }
}
