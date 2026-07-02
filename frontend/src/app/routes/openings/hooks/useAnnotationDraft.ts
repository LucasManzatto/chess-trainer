import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import type { AnnotationArrow, AnnotationCircle } from '../../../../features/board/components/ChessBoard/ChessBoard'
import type { PositionAnnotationArrow, PositionAnnotationCircle } from '../../../../features/openings/types'

type ReplaceAnnotations = UseMutationResult<
  { arrows: PositionAnnotationArrow[]; circles: PositionAnnotationCircle[] },
  Error,
  { arrows: AnnotationArrow[]; circles: AnnotationCircle[] }
>

function toDraftArrows(arrows: PositionAnnotationArrow[]): AnnotationArrow[] {
  return arrows.map(a => ({ from_square: a.from_square, to_square: a.to_square, color: a.color }))
}

function toDraftCircles(circles: PositionAnnotationCircle[]): AnnotationCircle[] {
  return circles.map(c => ({ square: c.square, color: c.color }))
}

export function useAnnotationDraft(
  fen: string,
  arrows: PositionAnnotationArrow[],
  circles: PositionAnnotationCircle[],
  isLoading: boolean,
  replace: ReplaceAnnotations,
) {
  const [draftArrows, setDraftArrows] = useState<AnnotationArrow[]>(() => toDraftArrows(arrows))
  const [draftCircles, setDraftCircles] = useState<AnnotationCircle[]>(() => toDraftCircles(circles))
  const [isDirty, setIsDirty] = useState(false)

  // Keep static track of the FEN across renders
  const prevFenRef = useRef(fen)

  // Keep server arrows/circles (and isDirty) handy for effects/callbacks without tracking
  // them as dependencies
  const latestServerState = useRef({ arrows, circles, isDirty })
  latestServerState.current = { arrows, circles, isDirty }

  // The moment the user plays a move and FEN changes, the draft always becomes the server
  // state for the new position (arrows/circles for the new fen may already be cached).
  if (fen !== prevFenRef.current) {
    prevFenRef.current = fen
    setDraftArrows(toDraftArrows(arrows))
    setDraftCircles(toDraftCircles(circles))
    setIsDirty(false)
  }

  // If the fen switch above landed while the query for the new position was still in
  // flight, arrows/circles were still stale/empty — resync once that fetch resolves, unless
  // the user already started drawing on this fen before it did.
  useEffect(() => {
    if (!isLoading) {
      setDraftArrows(toDraftArrows(latestServerState.current.arrows))
      setDraftCircles(toDraftCircles(latestServerState.current.circles))
    }
  }, [isLoading, fen])

  const onAnnotationsChange = useCallback((nextArrows: AnnotationArrow[], nextCircles: AnnotationCircle[]) => {
    setDraftArrows(nextArrows)
    setDraftCircles(nextCircles)
    setIsDirty(true)
  }, [])

  const commit = useCallback(() => {
    replace.mutate(
      { arrows: draftArrows, circles: draftCircles },
      { onSuccess: () => setIsDirty(false) },
    )
  }, [replace, draftArrows, draftCircles])

  const reset = useCallback(() => {
    setDraftArrows(toDraftArrows(latestServerState.current.arrows))
    setDraftCircles(toDraftCircles(latestServerState.current.circles))
    setIsDirty(false)
  }, [])

  return {
    arrows: draftArrows,
    circles: draftCircles,
    onAnnotationsChange,
    isDirty,
    commit,
    reset,
  }
}