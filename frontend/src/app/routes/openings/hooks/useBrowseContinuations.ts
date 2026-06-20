import { useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { getCurrentFen, useChessBoardStore } from '../../../../features/board'
import type { PositionMoveCreateBody } from '../../../../features/openings/types'
import type { UseMutateAsyncFunction } from '@tanstack/react-query'

function arrowToPositionMove(orig: string, dest: string, fromFen: string): PositionMoveCreateBody | null {
  const chess = new Chess(fromFen)
  try {
    const move = chess.move({ from: orig, to: dest })
    return { from_fen: fromFen, to_fen: chess.fen(), san: move.san, lan: move.from + move.to }
  } catch {
    return null
  }
}

interface UseBrowseContinuationsOptions {
  createMoveAsync: UseMutateAsyncFunction<unknown, Error, PositionMoveCreateBody>
  isPending: boolean
}

export function useBrowseContinuations({ createMoveAsync, isPending }: UseBrowseContinuationsOptions) {
  const currentFen       = useChessBoardStore(getCurrentFen)
  const drawnShapes      = useChessBoardStore(s => s.drawnShapes)
  const clearDrawnShapes = useChessBoardStore(s => s.clearDrawnShapes)

  const arrowShapes = useMemo(
    () => drawnShapes.filter(s => s.orig && s.dest && s.orig !== s.dest),
    [drawnShapes],
  )

  const saveArrowsAsMoves = useCallback(async () => {
    const bodies = arrowShapes
      .map(s => arrowToPositionMove(s.orig, s.dest!, currentFen))
      .filter((b): b is PositionMoveCreateBody => b !== null)
    clearDrawnShapes()
    await Promise.allSettled(bodies.map(body => createMoveAsync(body)))
  }, [arrowShapes, currentFen, createMoveAsync, clearDrawnShapes])

  return { arrowShapes, saveArrowsAsMoves, isPending }
}
