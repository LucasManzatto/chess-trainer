import { TEXT_COLOR_HEX } from './annotationConstants'

export function LineStyleIcon({ dash }: { dash: string }) {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" className="flex-shrink-0">
      <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={dash || undefined} />
    </svg>
  )
}

export function FillSquareIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" className="flex-shrink-0">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill={filled ? color : 'none'} fillOpacity={0.5} stroke={color} strokeWidth="2" />
    </svg>
  )
}

export function ArrowIcon({ color }: { color: string }) {
  const hex = TEXT_COLOR_HEX[color] ?? color
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" className="flex-shrink-0">
      <line x1="3" y1="13" x2="12" y2="4" stroke={hex} strokeWidth="2" strokeLinecap="round" />
      <polygon points="12,4 7,5 11,9" fill={hex} />
    </svg>
  )
}

export function CircleIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" className="flex-shrink-0">
      <circle cx="8" cy="8" r="5.5" fill="none" stroke={TEXT_COLOR_HEX[color] ?? color} strokeWidth="2" />
    </svg>
  )
}
