import { useEffect } from 'react'
import { Chess } from 'chess.js'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { Key } from '@lichess-org/chessground/types'
import type { Position as Opening } from '../../../../features/openings/types'
import { useChessBoardStore, useChessBoardStoreApi, getCurrentFen, getPlayedMoves } from '../../../../features/board'
import { isPrefix } from '../../../../features/openings/utils/movesMatch'

export function useNextMoveShapes(openings: Opening[]) {
  const chessBoardStore = useChessBoardStoreApi()
  const currentFen = useChessBoardStore(getCurrentFen)
  const playedMovesKey = useChessBoardStore(s => getPlayedMoves(s).join(','))

  useEffect(() => {
    const playedMoves = playedMovesKey ? playedMovesKey.split(',') : []
    const chess = new Chess(currentFen)
    const seen = new Set<string>()
    const shapes: DrawShape[] = []

    for (const opening of openings) {
      if (!isPrefix(playedMoves, opening)) continue
      const nextSan = opening.moves[playedMoves.length]
      if (!nextSan || seen.has(nextSan)) continue
      seen.add(nextSan)

      try {
        const move = chess.move(nextSan)
        shapes.push({ orig: move.from as Key, dest: move.to as Key, brush: 'hint' })
        chess.undo()
      } catch {
        // not valid from current position
      }
    }

    chessBoardStore.getState().setHintShapes(shapes)
  }, [openings, playedMovesKey, currentFen, chessBoardStore])
}
