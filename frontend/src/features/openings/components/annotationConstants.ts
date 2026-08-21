import type { AnnotationLineStyle } from '../../board/types'

// Matches the brush colors ChessBoard draws with (COLOR_TO_BRUSH in ChessBoard.tsx) — used for the color-picker swatches
export const COLOR_HEX: Record<string, string> = { G: '#15781B', R: '#882020', B: '#003088', Y: '#e68f00' }
// Lighter tints for on-dark legibility (WCAG AA against the ~10%-opacity pill bg) — used for the move-tag pill and its icon
export const TEXT_COLOR_HEX: Record<string, string> = { G: '#34d399', R: '#fda4af', B: '#60a5fa', Y: '#fbbf24' }
export const COLOR_ORDER = ['G', 'R', 'B', 'Y'] as const

// solid = concrete move, dashed = idea/plan, dotted = opponent threat.
export const LINE_STYLES: { value: AnnotationLineStyle; label: string; dash: string }[] = [
  { value: 'solid', label: 'Solid — concrete move', dash: '' },
  { value: 'dashed', label: 'Dashed — idea / plan', dash: '4 2' },
  { value: 'dotted', label: 'Dotted — opponent threat', dash: '1 2' },
]
