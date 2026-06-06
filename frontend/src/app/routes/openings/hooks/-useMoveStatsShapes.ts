import { useEffect, useMemo } from 'react'
import { Chess } from 'chess.js'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { Key } from '@lichess-org/chessground/types'
import type { MoveStat } from '../../../../features/engine/api'
import { useChessBoardStore, useChessBoardStoreApi, getPlayedMoves } from '../../../../features/board'
import { useMoveStats } from '../../../../features/engine/hooks/useMoveStats'

const COVERAGE_THRESHOLD = 80

function frequencyBrush(percentage: number): string {
  if (percentage >= 30) return 'green'
  if (percentage >= 10) return 'blue'
  return 'yellow'
}

function winrateBrush(wr: number): string {
  if (wr >= 55) return 'green'
  if (wr >= 45) return 'blue'
  return 'yellow'
}

function calcWinrate(stat: MoveStat, color: 'white' | 'black'): number {
  if (stat.total === 0) return 0
  return color === 'white' ? (stat.white / stat.total) * 100 : (stat.black / stat.total) * 100
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
  const orientation = useChessBoardStore(s => s.orientation)

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
    // 'w' | 'b' from FEN
    const turn = chess.turn() === 'w' ? 'white' : 'black'
    const isUserTurn = turn === orientation

    const moves = isUserTurn
      ? [...data.moves].sort((a, b) => calcWinrate(b, orientation) - calcWinrate(a, orientation)).slice(0, 5)
      : data.moves // already sorted by frequency from Lichess

    const shapes: DrawShape[] = []
    let covered = 0
    let rank = 1

    for (const stat of moves) {
      if (!isUserTurn && covered >= COVERAGE_THRESHOLD) break
      covered += stat.percentage
      try {
        const move = chess.move(stat.san)
        shapes.push({
          orig: move.from as Key,
          dest: move.to as Key,
          brush: isUserTurn ? winrateBrush(calcWinrate(stat, orientation)) : frequencyBrush(stat.percentage),
          label: { text: String(rank) },
        })
        chess.undo()
        rank++
      } catch {
        // stat.san not legal from this position — mismatch, still counts toward coverage
      }
    }

    chessBoardStore.getState().setHintShapes(shapes)
  }, [data, fen, orientation, chessBoardStore])
}
