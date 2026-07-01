import { useEffect } from 'react'
import { useChessBoardStoreApi } from '../../../../features/board'
import { useOpeningsStore, getSelectedPosition } from '../../../../stores/openingsStore'

export function useSyncOpeningToBoard() {
  const selectedOpening = useOpeningsStore(getSelectedPosition)
  const store = useChessBoardStoreApi()

  useEffect(() => {
    if (selectedOpening) {
      store.getState().loadMoves(selectedOpening.moves)
    } else {
      store.getState().reset()
    }
  }, [selectedOpening, store])
}
