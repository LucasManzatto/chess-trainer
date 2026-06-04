import { useOpeningsStore, getSelectedOpening } from '../../store/openingsStore'
import type { Opening } from '../../types'
import { FavoriteButton } from './FavoriteButton'

interface ListViewProps {
  openings: Opening[]
}

export function ListView({ openings }: ListViewProps) {
  const selectedOpening = useOpeningsStore(getSelectedOpening)
  const setSelectedOpening = useOpeningsStore(s => s.setSelectedOpening)

  return (
    <div className="py-1">
      {openings.map(opening => (
        <div key={opening.id} className="flex items-center group">
          <button
            onClick={() => setSelectedOpening(opening)}
            className={`flex-1 min-w-0 text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2 ${
              selectedOpening?.id === opening.id
                ? 'border-l-2 border-amber-400/70 bg-amber-500/10 text-white/90'
                : 'border-l-2 border-transparent text-white/45 hover:bg-white/[0.07] hover:text-white/80'
            }`}
          >
            <span className="truncate flex-1">{opening.name}</span>
          </button>
          <FavoriteButton openingId={opening.id} />
        </div>
      ))}
    </div>
  )
}
