import type { Opening } from '../../openings/types'
import { useOpeningsStore } from '../store/openingsStore'

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
              ? 'border-l-2 border-amber-400 bg-amber-500/10 text-amber-200'
              : 'border-l-2 border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="truncate flex-1">{opening.name}</span>
        </button>
      ))}
    </div>
  )
}
