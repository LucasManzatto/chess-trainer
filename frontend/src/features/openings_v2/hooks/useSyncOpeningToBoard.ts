import { useEffect } from 'react'
import { useChessBoardStoreApi } from '../../../components/ChessBoardV2'
import { useOpeningsStore } from '../store/openingsStore'

export function useSyncOpeningToBoard() {
  const selectedOpening = useOpeningsStore(s => s.selectedOpening)
  const store = useChessBoardStoreApi()

  useEffect(() => {
    if (selectedOpening) {
      store.getState().loadOpeningMoves(selectedOpening.moves)
    } else {
      store.getState().reset()
    }
  }, [selectedOpening, store])
}
