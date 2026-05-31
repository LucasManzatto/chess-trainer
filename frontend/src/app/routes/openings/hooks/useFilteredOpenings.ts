import { useMemo } from 'react'
import { useChessBoardStore } from '../../../../features/board'
import { useOpeningsStore } from '../../../../features/openings/store/openingsStore'
import { isPrefix } from '../../../../features/openings/utils/movesMatch'

export function useFilteredOpenings(search: string) {
  const openings = useOpeningsStore(s => s.openings)

  const playedMovesKey = useChessBoardStore(s =>
    s.history.slice(0, s.currentMoveIndex + 1).map(e => e.san).join(',')
  )

  return useMemo(() => {
    const playedMoves = playedMovesKey ? playedMovesKey.split(',') : []
    return openings.filter(o =>
      isPrefix(playedMoves, o) &&
      (!search || o.name.toLowerCase().includes(search.toLowerCase()))
    )
  }, [openings, search, playedMovesKey])
}
