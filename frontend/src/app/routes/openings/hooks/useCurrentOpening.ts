import { useMemo } from 'react'
import { getCurrentFen, useChessBoardStore } from '../../../../features/board'
import { useOpeningsStore } from '../../../../features/openings/store/openingsStore'
import { matchOpening } from '../../../../features/openings/utils/movesMatch'

export function useCurrentOpening() {
  const fen = useChessBoardStore(getCurrentFen)
  const openings = useOpeningsStore(s => s.openings)
  return useMemo(() => matchOpening(fen, openings), [fen, openings])
}
