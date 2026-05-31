import { useEffect, useRef } from 'react'
import { useChessBoardStore } from '../../../../features/board'
import { useOpeningsStore, getSelectedOpening } from '../../../../features/openings/store/openingsStore'
import { isPrefix, isExact } from '../../../../features/openings/utils/movesMatch'
import type { Opening } from '../../../../features/openings/types'

export function useSyncBoardToOpening(displayed: Opening[]) {
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  // Serialized to a primitive so the effect only re-runs when moves actually change,
  // not on every history array reference change.
  const playedMovesKey = useChessBoardStore(s =>
    s.history.slice(0, s.currentMoveIndex + 1).map(e => e.san).join(',')
  )
  const selectedOpening = useOpeningsStore(getSelectedOpening)
  const setSelectedOpening = useOpeningsStore(s => s.setSelectedOpening)
  // Ref avoids stale closure inside the effect without adding selectedOpening as a dep,
  // which would cause unnecessary re-runs every time the selection changes.
  const selectedOpeningRef = useRef(selectedOpening)
  selectedOpeningRef.current = selectedOpening

  useEffect(() => {
    if (currentMoveIndex < 0) {
      if (selectedOpeningRef.current !== null) setSelectedOpening(null)
      return
    }
    if (displayed.length === 0) {
      if (selectedOpeningRef.current !== null) setSelectedOpening(null)
      return
    }

    const playedMoves = playedMovesKey ? playedMovesKey.split(',') : []

    const current = selectedOpeningRef.current
    if (current) {
      // Keep selection stable while played moves are still a prefix of the current opening
      // AND current is still in displayed — re-selects correctly when a filter removes it.
      const stillCompatible = isPrefix(playedMoves, current) && displayed.some(o => o.id === current.id)
      if (stillCompatible) return
    }

    const exact = displayed.find(o => isExact(playedMoves, o))
    // No exact match: fall back to the shortest displayed opening so the selection
    // stays as specific as possible without jumping to an unrelated line.
    const best = exact ?? displayed.reduce((a, b) => a.moves.length <= b.moves.length ? a : b, displayed[0])

    if (best.id !== current?.id) setSelectedOpening(best)
  }, [playedMovesKey, displayed, currentMoveIndex, setSelectedOpening])
}
