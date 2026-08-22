import { useState, useCallback } from 'react'
import type { BoardAnnotationArrow, BoardAnnotationCircle } from '../types'

// Bundles the annotation-hover concern shared between ChessBoard (draws shapes, reports pointer
// hover) and any external list (AnnotationsList/Notes — reports row hover) into one owned piece
// of state, instead of the caller threading hoveredKey + two separate callbacks by hand.
//
// `arrows`/`circles` pass straight through unmodified — this hook owns hover + change wiring
// only, not the annotation data itself (that stays wherever it's sourced: a store, draft state,
// computed page state like a best-move overlay).
export function useBoardAnnotations(
  arrows: BoardAnnotationArrow[],
  circles: BoardAnnotationCircle[],
  onDraftChange: (arrows: BoardAnnotationArrow[], circles: BoardAnnotationCircle[]) => void,
) {
  // Key (arrowKey / circle square) of the annotation currently hovered — set from either the
  // board itself (shape hover) or an external list (row hover), so both sides highlight the
  // same annotation and dim the rest.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const onHoverEntry = useCallback((key: string | null) => setHoveredKey(key), [])

  return { arrows, circles, hoveredKey, onChange: onDraftChange, onHoverEntry, setHoveredKey }
}
