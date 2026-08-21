export type AnnotationCategory = 'best_move' | 'attacker' | 'defender' | 'target' | 'threat' | 'idea'

// solid = concrete move, dashed = idea/plan, dotted = opponent threat — visual language on
// top of color/category, chosen independently of either.
export type AnnotationLineStyle = 'solid' | 'dashed' | 'dotted'

export type BoardAnnotationArrow = {
  from_square: string
  to_square: string
  color: string
  category: AnnotationCategory | null
  comment: string | null
  line_style: AnnotationLineStyle
  // Step number in a multi-move plan (arrows 1, 2, 3 depicting a sequence). Null = unordered.
  order: number | null
  // Groups this arrow with others into one chained plan (Nf6 -> Bg4 -> e3 -> Nc6), rendered
  // as a single row in AnnotationsList and ordered by `order`. Client-generated (uuid), null
  // for a standalone arrow.
  line_id: string | null
}
export type BoardAnnotationCircle = {
  square: string
  color: string
  category: AnnotationCategory | null
  comment: string | null
  line_style: AnnotationLineStyle
  // Filled square wash instead of a ring — marks a concept (weak square, outpost) on the
  // square itself rather than a move-related idea.
  fill: boolean
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
