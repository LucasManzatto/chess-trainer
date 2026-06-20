import { useEffect } from 'react'
import { getCurrentFen, useChessBoardStore } from '../../../../features/board'
import { usePositionMoves } from '../../../../features/openings/hooks/usePositionMoves'
import type { Key } from '@lichess-org/chessground/types'

export function useContinuationShapes() {
  const currentFen    = useChessBoardStore(getCurrentFen)
  const setHintShapes = useChessBoardStore(s => s.setHintShapes)

  const { moves: continuations, create: createMove } = usePositionMoves(currentFen)

  useEffect(() => {
    setHintShapes(continuations.map(m => ({
      orig: m.lan.slice(0, 2) as Key,
      dest: m.lan.slice(2, 4) as Key,
      brush: m.is_main_line ? 'green' : 'blue',
    })))
  }, [continuations, setHintShapes])

  return { createMove }
}
