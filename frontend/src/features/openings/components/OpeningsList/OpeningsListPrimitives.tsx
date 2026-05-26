import type { Opening } from '../../types'
import { openingColor } from '../../types'

export function ColorBadge({ opening }: { opening: Opening }) {
  const color = openingColor(opening)
  return (
    <span className={`text-[10px] font-bold px-1 py-0.5 rounded leading-none flex-shrink-0 ${
      color === 'white' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-gray-200'
    }`}>
      {color === 'white' ? 'W' : 'B'}
    </span>
  )
}

export type StarState = 'full' | 'partial' | 'empty'

export function StarButton({ state, onClick }: { state: StarState; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} className="flex-shrink-0 px-1 py-1">
      <span className={`text-xs ${
        state === 'full' ? 'text-amber-400' :
        state === 'partial' ? 'text-amber-400/40' :
        'text-gray-600 hover:text-gray-400'
      }`}>
        {state === 'empty' ? '☆' : '★'}
      </span>
    </button>
  )
}
