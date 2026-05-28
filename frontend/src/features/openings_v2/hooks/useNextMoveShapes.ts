import { useEffect } from 'react'
import { Chess } from 'chess.js'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { Key } from '@lichess-org/chessground/types'
import { useChessBoardStore, useChessBoardStoreApi } from '../../../components/ChessBoardV2'
import { useOpeningsStore } from '../store/openingsStore'
import { getFenAtIndex } from '../../../chess/game'

const INITIAL_FEN = new Chess().fen()

export function useNextMoveShapes() {
  const openings = useOpeningsStore(s => s.openings)
  const chessBoardStore = useChessBoardStoreApi()

  const playedMovesKey = useChessBoardStore(s =>
    s.history.slice(0, s.currentMoveIndex + 1).map(e => e.san).join(',')
  )

  const currentFen = useChessBoardStore(s =>
    s.lastExternalFen ?? getFenAtIndex(s.history, s.currentMoveIndex) ?? INITIAL_FEN
  )

  useEffect(() => {
    const playedMoves = playedMovesKey ? playedMovesKey.split(',') : []
    const chess = new Chess(currentFen)
    const seen = new Set<string>()
    const shapes: DrawShape[] = []

    for (const opening of openings) {
      if (!playedMoves.every((san, i) => opening.moves[i] === san)) continue
      const nextSan = opening.moves[playedMoves.length]
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
