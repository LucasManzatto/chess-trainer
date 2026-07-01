import { useCallback, useState } from 'react'
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
  replace: ReplaceAnnotations,
) {
  const [prevFen, setPrevFen] = useState(fen)
  const [draftArrows, setDraftArrows] = useState<AnnotationArrow[]>(() => toDraftArrows(arrows))
  const [draftCircles, setDraftCircles] = useState<AnnotationCircle[]>(() => toDraftCircles(circles))
  const [isDirty, setIsDirty] = useState(false)

  if (fen !== prevFen) {
    // Reset draft only on position switch, not every time arrows/circles refetch (would wipe in-progress edits).
    setPrevFen(fen)
    setDraftArrows(toDraftArrows(arrows))
    setDraftCircles(toDraftCircles(circles))
    setIsDirty(false)
  }

  const onAnnotationsChange = useCallback((nextArrows: AnnotationArrow[], nextCircles: AnnotationCircle[]) => {
    setDraftArrows(nextArrows)
    setDraftCircles(nextCircles)
    setIsDirty(true)
  }, [])

  const commit = () => {
    replace.mutate(
      { arrows: draftArrows, circles: draftCircles },
      { onSuccess: () => setIsDirty(false) },
    )
  }

  const reset = () => {
    setDraftArrows(toDraftArrows(arrows))
    setDraftCircles(toDraftCircles(circles))
    setIsDirty(false)
  }

  return {
    arrows: draftArrows,
    circles: draftCircles,
    onAnnotationsChange,
    isDirty,
    commit,
    reset,
    isSaving: replace.isPending,
  }
}
