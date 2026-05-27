import type { Opening } from '../../types'
import { ColorBadge, StarButton } from './OpeningsListPrimitives'

interface OpeningsListRowProps {
  opening: Opening
  isSelected: boolean
  isFavorite: boolean
  onSelect: (o: Opening) => void
  onToggleFavorite: (id: number) => void
}

export function OpeningsListRow({ opening, isSelected, isFavorite, onSelect, onToggleFavorite }: OpeningsListRowProps) {
  return (
    <button
      onClick={() => onSelect(opening)}
      className={`w-full text-left pl-2 pr-3 py-1.5 text-sm transition-colors flex items-center gap-2 min-w-0 ${
        isSelected
          ? 'border-l-2 border-amber-400 bg-amber-500/10 text-amber-200'
          : 'border-l-2 border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <ColorBadge opening={opening} />
      <span className="truncate flex-1">{opening.name}</span>
      <StarButton
        state={isFavorite ? 'full' : 'empty'}
        onClick={e => { e.stopPropagation(); onToggleFavorite(opening.id) }}
      />
    </button>
  )
}
