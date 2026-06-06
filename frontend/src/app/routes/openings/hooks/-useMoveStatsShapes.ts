import { useEffect, useMemo } from 'react'
import { Chess } from 'chess.js'
import type { DrawBrush, DrawShape } from '@lichess-org/chessground/draw'
import type { Key } from '@lichess-org/chessground/types'
import type { MoveStat } from '../../../../features/engine/api'
import { arrowTokens } from '../../../../features/engine/arrowTokens'
import { useChessBoardStore, useChessBoardStoreApi, getPlayedMoves } from '../../../../features/board'
import { useMoveStats } from '../../../../features/engine/hooks/useMoveStats'
import { useBoardSettings } from '../../../../features/board/store/boardSettingsStore'

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

function calcScore(stat: MoveStat, color: 'white' | 'black'): number {
  if (stat.total === 0) return 0
  const wins = color === 'white' ? stat.white : stat.black
  return (wins + 0.5 * stat.draws) / stat.total
}

function calcWinrate(stat: MoveStat, color: 'white' | 'black'): number {
  if (stat.total === 0) return 0
  return color === 'white' ? (stat.white / stat.total) * 100 : (stat.black / stat.total) * 100
}

type ShapeBundle = { shapes: DrawShape[]; brushes: Record<string, DrawBrush> }

function buildOpponentShapes(moves: MoveStat[], chess: Chess, sq: number): ShapeBundle {
  const t = arrowTokens.opponent
  const topFreq = moves[0]?.percentage ?? 1
  const shapes: DrawShape[] = []
  const brushes: Record<string, DrawBrush> = {}

  let covered = 0
  let rank = 1
  for (const stat of moves) {
    if (covered >= 80) break
    try {
      const move = chess.move(stat.san)
      covered += stat.percentage
      const f = stat.percentage / topFreq
      const key = `opp-${rank}`
      brushes[key] = { key, color: t.color, opacity: t.opacity(f), lineWidth: t.thicknessPx(f, sq) }
      shapes.push({
        orig: move.from as Key,
        dest: move.to as Key,
        brush: key,
        label: { text: `${Math.round(stat.percentage)}%` },
      })
      chess.undo()
      rank++
    } catch {
      // stat.san not legal from this position — skip without counting toward coverage
    }
  }

  return { shapes, brushes }
}

function buildMineShapes(moves: MoveStat[], chess: Chess, sq: number, color: 'white' | 'black'): ShapeBundle {
  const t = arrowTokens.mine
  const lineWidth = t.thicknessPx(sq)
  const shapes: DrawShape[] = []
  const brushes: Record<string, DrawBrush> = {}

  for (const stat of moves) {
    try {
      const move = chess.move(stat.san)
      let key: string

      if (stat.total < t.minGamesToTrust) {
        key = 'mine-low'
        if (!brushes[key]) {
          brushes[key] = { key, color: t.lowSample.stroke, opacity: 0.7, lineWidth: t.lowSample.strokeWidthPx }
        }
      } else {
        const score = calcScore(stat, color)
        const band = t.bands.find(b => b.when(score)) ?? t.bands[t.bands.length - 1]
        key = `mine-${band.name}`
        if (!brushes[key]) {
          brushes[key] = { key, color: band.color, opacity: t.opacity, lineWidth }
        }
      }

      const wr = calcWinrate(stat, color)
      shapes.push({
        orig: move.from as Key,
        dest: move.to as Key,
        brush: key,
        modifiers: { hilite: t.outline.color },
        label: { text: `${Math.round(wr)}%` },
      })
      chess.undo()
    } catch {
      // not legal from this position
    }
  }

  return { shapes, brushes }
}

export function useMoveStatsShapes() {
  const chessBoardStore = useChessBoardStoreApi()
  const playedMovesKey = useChessBoardStore(s => getPlayedMoves(s).join('|'))
  const orientation = useChessBoardStore(s => s.orientation)
  const boardSize = useBoardSettings(s => s.boardSize)

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

    const sq = boardSize / 8
    const chess = new Chess(fen)
    const turn = chess.turn() === 'w' ? 'white' : 'black'
    const isUserTurn = turn === orientation

    let bundle: ShapeBundle
    if (isUserTurn) {
      const sorted = [...data.moves]
        .sort((a, b) => calcScore(b, orientation) - calcScore(a, orientation))
        .slice(0, 5)
      bundle = buildMineShapes(sorted, chess, sq, orientation)
    } else {
      bundle = buildOpponentShapes(data.moves, chess, sq)
    }

    chessBoardStore.getState().setHintShapes(bundle.shapes, bundle.brushes)
  }, [data, fen, orientation, boardSize, chessBoardStore])
}
