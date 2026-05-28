import { useEffect } from 'react'
import { Chess } from 'chess.js'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { Key } from '@lichess-org/chessground/types'
import type { Opening } from '../../../../features/openings/types'
import { useChessBoardStore, useChessBoardStoreApi } from '../../../../features/ChessBoardV2'
import { getFenAtIndex } from '../../../../chess/game'

const INITIAL_FEN = new Chess().fen()

export function useNextMoveShapes(openings: Opening[]) {
  const chessBoardStore = useChessBoardStoreApi()

  const playedMovesKey = useChessBoardStore(s =>
    s.history.slice(0, s.currentMoveIndex + 1).map(e => e.san).join(',')
  )

  const currentFen = useChessBoardStore(s =>
    s.lastExternalFen ?? getFenAtIndex(s.history, s.currentMoveIndex) ?? INITIAL_FEN
  )

  useEffect(() => {
    const nextMoveIndex = playedMovesKey ? playedMovesKey.split(',').length : 0
    const chess = new Chess(currentFen)
    const seen = new Set<string>()
    const shapes: DrawShape[] = []

    for (const opening of openings) {
      const nextSan = opening.moves[nextMoveIndex]
      if (!nextSan || seen.has(nextSan)) continue
      seen.add(nextSan)

      const move = chess.move(nextSan)
      if (move) {
        shapes.push({ orig: move.from as Key, dest: move.to as Key, brush: 'hint' })
        chess.undo()
      }
    }

    chessBoardStore.getState().setHintShapes(shapes)
  }, [openings, playedMovesKey, currentFen, chessBoardStore])
}
