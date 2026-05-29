import { useOpeningsStore, getSelectedOpening } from '../store/openingsStore'

export function ChessBoardHeader() {
  const selectedOpening = useOpeningsStore(getSelectedOpening)

  return (
    <div className="flex items-start w-full select-none pointer-events-none px-1">
      {selectedOpening ? (
        <span
          className="text-white/90 font-semibold leading-tight truncate"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px' }}
        >
          {selectedOpening.name}
        </span>
      ) : (
        <span
          className="text-white/20 font-semibold leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px' }}
        >
          Select an opening
        </span>
      )}
    </div>
  )
}
