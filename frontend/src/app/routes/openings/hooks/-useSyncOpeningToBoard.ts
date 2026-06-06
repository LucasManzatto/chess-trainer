import { useEffect } from 'react'
import { useChessBoardStoreApi } from '../../../../features/board'
import { useOpeningsStore, getSelectedOpening } from '../../../../features/openings/store/openingsStore'

export function useSyncOpeningToBoard() {
  const selectedOpening = useOpeningsStore(getSelectedOpening)
  const store = useChessBoardStoreApi()

  useEffect(() => {
    if (selectedOpening) {
      const state = store.getState()
      state.loadMoves(selectedOpening.moves)
      state.setHintShapes([])
    } else {
      store.getState().reset()
    }
  }, [selectedOpening, store])
}
