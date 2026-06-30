import { useCallback } from 'react'
import { getCurrentFen, useChessBoardStore } from '../../../../features/board'
import { arrowToMove } from '../../../../lib/chess'
import type { PositionMoveCreateBody } from '../../../../features/openings/types'
import type { UseMutateAsyncFunction } from '@tanstack/react-query'

interface UseBrowseContinuationsOptions {
  createMoveAsync: UseMutateAsyncFunction<unknown, Error, PositionMoveCreateBody>
  isPending: boolean
}

export function useBrowseContinuations({ createMoveAsync, isPending }: UseBrowseContinuationsOptions) {
  const currentFen       = useChessBoardStore(getCurrentFen)
  const drawnShapes      = useChessBoardStore(s => s.drawnShapes)
  const clearDrawnShapes = useChessBoardStore(s => s.clearDrawnShapes)

  const arrowShapes = drawnShapes.filter(s => s.orig && s.dest && s.orig !== s.dest)

  const saveArrowsAsMoves = useCallback(async () => {
    const bodies = arrowShapes
      .map(s => arrowToMove(s.orig, s.dest!, currentFen))
      .filter(m => m !== null)
      .map((m): PositionMoveCreateBody => ({ from_fen: m.fromFen, to_fen: m.toFen, san: m.san, lan: m.lan }))
    clearDrawnShapes()
    await Promise.allSettled(bodies.map(body => createMoveAsync(body)))
  }, [arrowShapes, currentFen, createMoveAsync, clearDrawnShapes])

  return { arrowShapes, saveArrowsAsMoves, isPending }
}
