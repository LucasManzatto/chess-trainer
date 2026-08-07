export type AnnotationCategory = 'best_move' | 'attacker' | 'defender' | 'target' | 'threat' | 'idea'

export type BoardAnnotationArrow = {
  from_square: string
  to_square: string
  color: string
  category: AnnotationCategory | null
  comment: string | null
}
export type BoardAnnotationCircle = {
  square: string
  color: string
  category: AnnotationCategory | null
  comment: string | null
}

export type AnnotationCategoryMeta = { value: AnnotationCategory; label: string; glyph: string; fill: string }

// Glyph + fill drawn onto the arrow/circle itself via a chessground customSvg shape
// (see ChessBoard.tsx), and used as the icon in the AnnotationsList category picker.
export const ANNOTATION_CATEGORIES: AnnotationCategoryMeta[] = [
  { value: 'best_move', label: 'Best move', glyph: '★', fill: '#34d399' },
  { value: 'attacker', label: 'Attacker', glyph: 'A', fill: '#fda4af' },
  { value: 'defender', label: 'Defender', glyph: 'D', fill: '#60a5fa' },
  { value: 'target', label: 'Target', glyph: '◎', fill: '#fbbf24' },
  { value: 'threat', label: 'Threat', glyph: '!', fill: '#f87171' },
  { value: 'idea', label: 'Idea', glyph: '?', fill: '#c084fc' },
]

export const ANNOTATION_CATEGORY_BY_VALUE: Record<AnnotationCategory, AnnotationCategoryMeta> =
  Object.fromEntries(ANNOTATION_CATEGORIES.map(c => [c.value, c])) as Record<AnnotationCategory, AnnotationCategoryMeta>
