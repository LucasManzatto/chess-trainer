import { useOpeningsStore, getSelectedPosition } from '../store/openingsStore'
import { useChessBoardStoreApi } from '../../board'

export function ChessBoardHeader() {
  const selectedOpening = useOpeningsStore(getSelectedPosition)
  const boardApi = useChessBoardStoreApi()

  function handleReset() {
    if (!selectedOpening) return
    const state = boardApi.getState()
    state.loadMoves(selectedOpening.moves)
    state.setHintShapes([])
  }

  return (
    <div className="flex items-center w-full select-none px-1 gap-2">
      {selectedOpening ? (
        <>
          <span
            className="text-white/90 font-semibold leading-tight truncate"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px' }}
          >
            {selectedOpening.name}
          </span>
          <button
            onClick={handleReset}
            className="ml-1 flex-shrink-0 text-white/40 hover:text-white/80 transition-colors"
            title="Reset to opening position"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </>
      ) : (
        <span
          className="text-white/20 font-semibold leading-tight pointer-events-none"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px' }}
        >
          Select an opening
        </span>
      )}
    </div>
  )
}
