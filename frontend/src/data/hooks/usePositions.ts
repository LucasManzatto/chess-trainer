import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPositions,
  openingsApi,
  positionAnnotationsApi,
  positionCommentsApi,
  positionsApi,
} from '../api'
import { openingsKeys, positionsKeys } from '../queryKeys'
import type {
  Position,
  PositionAnnotationArrow,
  PositionAnnotationCircle,
  PositionDetail,
} from '../../features/openings/types'

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

export function useOpening(fen: string) {
  return useQuery({
    queryKey: openingsKeys.byFen(fen),
    queryFn: ({ signal }) => openingsApi.getByFen(fen, signal),
    enabled: !!fen,
  })
}

/** Opening for the nearest fen in `fens` (current position, then its ancestors) that has one. */
export function useNearestOpening(fens: string[]) {
  return useQuery({
    queryKey: openingsKeys.nearest(fens),
    queryFn: ({ signal }) => openingsApi.getNearest(fens, signal),
    enabled: fens.length > 0,
  })
}

/** Named openings that branch off later than the current move prefix. */
export function useOpeningBranches(uciMoves: string[]) {
  return useQuery({
    queryKey: openingsKeys.branches(uciMoves),
    queryFn: ({ signal }) => openingsApi.getBranches(uciMoves, signal),
    enabled: uciMoves.length > 0,
  })
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
      arrows: Pick<PositionAnnotationArrow, 'from_square' | 'to_square' | 'color' | 'category' | 'comment' | 'line_style' | 'order'>[]
      circles: Pick<PositionAnnotationCircle, 'square' | 'color' | 'category' | 'comment' | 'line_style' | 'fill'>[]
    }) => positionAnnotationsApi.replace(fen, arrows, circles),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { replace }
}
