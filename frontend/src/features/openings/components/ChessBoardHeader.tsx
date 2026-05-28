import { useOpeningsStore } from '../store/openingsStore'

export function ChessBoardHeader() {
  const selectedOpening = useOpeningsStore(s => s.selectedOpening)

  return (
    <div className="flex items-start w-full select-none pointer-events-none">
      {selectedOpening ? (
        <span className="text-lg font-semibold text-white/90 truncate">{selectedOpening.name}</span>
      ) : (
        <span className="text-lg font-semibold text-white/30">No opening selected</span>
      )}
    </div>
  )
}
