import { useMemo } from 'react'
import { INITIAL_FEN, getCurrentFen, useChessBoardStore } from '../../../../features/board'
import { getSanMoves } from '../../../../lib/chess'
import type { PositionMoveCreateBody } from '../../../../features/openings/types'
import type { HistoryEntry } from '../../../../lib/chess/types'

function getLastMove(
  history: HistoryEntry[],
  currentMoveIndex: number,
  preAnswerFen: string,
): PositionMoveCreateBody | undefined {
  if (currentMoveIndex < 0) return undefined
  const entry = history[currentMoveIndex]
  return { from_fen: preAnswerFen, to_fen: entry.fen, san: entry.san, lan: entry.from + entry.to }
}

export function useBrowseBoard() {
  const history          = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const currentFen       = useChessBoardStore(getCurrentFen)

  const preAnswerFen = currentMoveIndex > 0 ? history[currentMoveIndex - 1].fen : INITIAL_FEN

  const { sanMoves, lastMove } = useMemo(
    () => ({
      sanMoves: getSanMoves(history, currentMoveIndex),
      lastMove: getLastMove(history, currentMoveIndex, preAnswerFen),
    }),
    [history, currentMoveIndex, preAnswerFen],
  )

  return { currentFen, preAnswerFen, sanMoves, lastMove }
}
