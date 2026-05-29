import { useEffect } from 'react'
import { useChessBoardStore } from '../../../../features/board'
import { useOpeningsStore } from '../../../../features/openings/store/openingsStore'
import type { Opening } from '../../../../features/openings/types'

export function useSyncBoardToOpening(displayed: Opening[]) {
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const playedMovesKey = useChessBoardStore(s =>
    s.history.slice(0, s.currentMoveIndex + 1).map(e => e.san).join(',')
  )
  const selectedOpening = useOpeningsStore(s => s.selectedOpening)
  const setSelectedOpening = useOpeningsStore(s => s.setSelectedOpening)

  useEffect(() => {
    if (currentMoveIndex < 0) {
      if (selectedOpening !== null) setSelectedOpening(null)
      return
    }
    if (displayed.length === 0) return

    const playedMoves = playedMovesKey.split(',')

    const exact = displayed.find(o =>
      o.moves.length === playedMoves.length && playedMoves.every((m, i) => m === o.moves[i])
    )
    const best = exact ?? displayed.reduce((a, b) => a.moves.length <= b.moves.length ? a : b, displayed[0])

    setSelectedOpening(best)
  }, [playedMovesKey, displayed, currentMoveIndex, selectedOpening, setSelectedOpening])
}
