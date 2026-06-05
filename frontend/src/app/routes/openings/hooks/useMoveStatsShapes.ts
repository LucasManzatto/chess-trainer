import { useEffect, useMemo } from 'react'
import { Chess } from 'chess.js'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { Key } from '@lichess-org/chessground/types'
import { useChessBoardStore, useChessBoardStoreApi, getCurrentFen, getPlayedMoves } from '../../../../features/board'
import { useMoveStats } from '../../../../features/engine/hooks/useMoveStats'

const COVERAGE_THRESHOLD = 80

function brush(percentage: number): string {
  if (percentage >= 30) return 'green'
  if (percentage >= 10) return 'blue'
  return 'yellow'
}

// Lichess Explorer requires UCI (e2e4), board store gives SAN (e4)
function sanArrayToUci(sanMoves: string[]): string[] {
  const chess = new Chess()
  const uci: string[] = []
  for (const san of sanMoves) {
    try {
      const m = chess.move(san)
      uci.push(m.promotion ? `${m.from}${m.to}${m.promotion}` : `${m.from}${m.to}`)
    } catch {
      break
    }
  }
  return uci
}

export function useMoveStatsShapes() {
  const chessBoardStore = useChessBoardStoreApi()
  const currentFen = useChessBoardStore(getCurrentFen)
  const playedMovesKey = useChessBoardStore(s => getPlayedMoves(s).join('|'))

  const uciMoves = useMemo(
    () => sanArrayToUci(playedMovesKey ? playedMovesKey.split('|') : []),
    [playedMovesKey],
  )

  const { data } = useMoveStats(uciMoves)

  useEffect(() => {
    if (!data) {
      chessBoardStore.getState().setHintShapes([])
      return
    }

    const chess = new Chess(currentFen)
    const shapes: DrawShape[] = []

    let covered = 0
    for (const stat of data.moves) {
      if (covered >= COVERAGE_THRESHOLD) break
      covered += stat.percentage
      try {
        const move = chess.move(stat.san)
        shapes.push({ orig: move.from as Key, dest: move.to as Key, brush: brush(stat.percentage) })
        chess.undo()
      } catch {
        // stat.san not legal from currentFen — position mismatch, still counts toward coverage
      }
    }

    chessBoardStore.getState().setHintShapes(shapes)
  }, [data, currentFen, chessBoardStore])
}
