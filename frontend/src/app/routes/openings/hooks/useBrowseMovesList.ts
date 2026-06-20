import { useCallback, useMemo } from 'react'
import { getActiveMove, getMoves, useChessBoardStore } from '../../../../features/board'

export function useBrowseMovesList() {
  const history          = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const navigateToIndex  = useChessBoardStore(s => s.navigateToIndex)

  const moves      = useMemo(() => getMoves(history), [history])
  const activeMove = getActiveMove(currentMoveIndex)

  const onMoveClick = useCallback((moveNumber: number, color: 'white' | 'black') => {
    navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
  }, [navigateToIndex])

  return { moves, activeMove, onMoveClick }
}
