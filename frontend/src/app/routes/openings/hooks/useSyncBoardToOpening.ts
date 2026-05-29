import { useEffect, useRef } from 'react'
import { useChessBoardStore } from '../../../../features/board'
import { useOpeningsStore, getSelectedOpening } from '../../../../features/openings/store/openingsStore'
import type { Opening } from '../../../../features/openings/types'

export function useSyncBoardToOpening(displayed: Opening[]) {
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const playedMovesKey = useChessBoardStore(s =>
    s.history.slice(0, s.currentMoveIndex + 1).map(e => e.san).join(',')
  )
  const selectedOpening = useOpeningsStore(getSelectedOpening)
  const setSelectedOpening = useOpeningsStore(s => s.setSelectedOpening)
  const selectedOpeningRef = useRef(selectedOpening)
  selectedOpeningRef.current = selectedOpening

  useEffect(() => {
    if (currentMoveIndex < 0) {
      if (selectedOpeningRef.current !== null) setSelectedOpening(null)
      return
    }
    if (displayed.length === 0) return

    const playedMoves = playedMovesKey ? playedMovesKey.split(',') : []

    const current = selectedOpeningRef.current
    if (current) {
      const stillCompatible = playedMoves.length <= current.moves.length &&
        playedMoves.every((m, i) => m === current.moves[i])
      if (stillCompatible) return
    }

    const exact = displayed.find(o =>
      o.moves.length === playedMoves.length && playedMoves.every((m, i) => m === o.moves[i])
    )
    const best = exact ?? displayed.reduce((a, b) => a.moves.length <= b.moves.length ? a : b, displayed[0])

    if (best.id !== current?.id) setSelectedOpening(best)
  }, [playedMovesKey, displayed, currentMoveIndex, setSelectedOpening])
}
