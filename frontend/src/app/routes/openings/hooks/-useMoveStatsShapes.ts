import { useEffect, useMemo } from 'react'
import { Chess } from 'chess.js'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { Key } from '@lichess-org/chessground/types'
import { useChessBoardStore, useChessBoardStoreApi, getPlayedMoves } from '../../../../features/board'
import { useMoveStats } from '../../../../features/engine/hooks/useMoveStats'

const COVERAGE_THRESHOLD = 80

function brush(percentage: number): string {
  if (percentage >= 30) return 'green'
  if (percentage >= 10) return 'blue'
  return 'yellow'
}

// Lichess Explorer requires UCI (e2e4), board store gives SAN (e4).
// Returns both the UCI move list and the FEN after replaying all moves,
// so the effect always uses the FEN that corresponds to the queried moves.
function sanArrayToUciAndFen(sanMoves: string[]): { uciMoves: string[]; fen: string } {
  const chess = new Chess()
  const uciMoves: string[] = []
  for (const san of sanMoves) {
    try {
      const m = chess.move(san)
      uciMoves.push(m.promotion ? `${m.from}${m.to}${m.promotion}` : `${m.from}${m.to}`)
    } catch {
      break
    }
  }
  return { uciMoves, fen: chess.fen() }
}

export function useMoveStatsShapes() {
  const chessBoardStore = useChessBoardStoreApi()
  const playedMovesKey = useChessBoardStore(s => getPlayedMoves(s).join('|'))

  const { uciMoves, fen } = useMemo(
    () => sanArrayToUciAndFen(playedMovesKey ? playedMovesKey.split('|') : []),
    [playedMovesKey],
  )

  const { data } = useMoveStats(uciMoves)

  useEffect(() => {
    if (!data) {
      chessBoardStore.getState().setHintShapes([])
      return
    }

    const chess = new Chess(fen)
    const shapes: DrawShape[] = []

    let covered = 0
    let rank = 1
    for (const stat of data.moves) {
      if (covered >= COVERAGE_THRESHOLD) break
      covered += stat.percentage
      try {
        const move = chess.move(stat.san)
        shapes.push({
          orig: move.from as Key,
          dest: move.to as Key,
          brush: brush(stat.percentage),
          label: { text: String(rank) },
        })
        chess.undo()
        rank++
      } catch {
        // stat.san not legal from this position — mismatch, still counts toward coverage
      }
    }

    chessBoardStore.getState().setHintShapes(shapes)
  }, [data, fen, chessBoardStore])
}
