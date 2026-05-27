import { useMemo } from 'react'
import { Chess } from 'chess.js'
import { useChessStore } from '../stores/chessStore'
import { getFenAtIndex } from '../../../chess/game'
import { computeThreats } from '../../../chess/analysis'
import type { ThreatSquares } from '../types'
import type { Key, Dests } from '@lichess-org/chessground/types'

const EMPTY_THREATS: ThreatSquares = { hanging: [], pinned: [] }

export function useChessDerivedState() {
  const history = useChessStore(s => s.history)
  const currentMoveIndex = useChessStore(s => s.currentMoveIndex)

  const chess = useMemo(
    () => new Chess(getFenAtIndex(history, currentMoveIndex)),
    [history, currentMoveIndex],
  )

  const turn: 'white' | 'black' = chess.turn() === 'w' ? 'white' : 'black'

  const dests = useMemo(() => {
    const map: Dests = new Map()
    for (const move of chess.moves({ verbose: true })) {
      const list = map.get(move.from as Key) ?? []
      list.push(move.to as Key)
      map.set(move.from as Key, list)
    }
    return map
  }, [chess])

  const lastEntry = currentMoveIndex >= 0 ? history[currentMoveIndex] : undefined
  const threats: ThreatSquares = lastEntry ? computeThreats(lastEntry.fen) : EMPTY_THREATS

  return { chess, turn, dests, lastEntry, threats, history, currentMoveIndex }
}
