import type { Opening } from '../../hooks/useOpenings'
import { useOpeningsStore } from '../../store/openingsStore'

interface ListViewProps {
  openings: Opening[]
}

export function ListView({ openings }: ListViewProps) {
  const selectedOpening = useOpeningsStore(s => s.selectedOpening)
  const setSelectedOpening = useOpeningsStore(s => s.setSelectedOpening)

  return (
    <div className="py-1">
      {openings.map(opening => (
        <button
          key={opening.id}
          onClick={() => setSelectedOpening(opening)}
          className={`w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2 min-w-0 ${
            selectedOpening?.id === opening.id
              ? 'border-l-2 border-amber-400/70 bg-amber-500/10 text-white/90'
              : 'border-l-2 border-transparent text-white/45 hover:bg-white/[0.07] hover:text-white/80'
          }`}
        >
          <span className="truncate flex-1">{opening.name}</span>
        </button>
      ))}
    </div>
  )
}
