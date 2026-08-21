import type { BoardAnnotationArrow } from '../../board/types'

export type ArrowMember = { arrow: BoardAnnotationArrow; index: number }
export type ArrowEntry =
  | { kind: 'solo'; arrow: BoardAnnotationArrow; index: number }
  | { kind: 'line'; lineId: string; members: ArrowMember[] }

// Groups arrows sharing a line_id into one entry (members ordered by `order`), preserving the
// position of each entry's first occurrence in the original list.
export function groupArrowEntries(arrows: BoardAnnotationArrow[]): ArrowEntry[] {
  const entries: ArrowEntry[] = []
  const seenLines = new Set<string>()
  arrows.forEach((arrow, index) => {
    if (!arrow.line_id) {
      entries.push({ kind: 'solo', arrow, index })
      return
    }
    if (seenLines.has(arrow.line_id)) return
    seenLines.add(arrow.line_id)
    const members = arrows
      .map((a, i) => ({ arrow: a, index: i }))
      .filter((m) => m.arrow.line_id === arrow.line_id)
      .sort((a, b) => (a.arrow.order ?? 0) - (b.arrow.order ?? 0))
    entries.push({ kind: 'line', lineId: arrow.line_id, members })
  })
  return entries
}

// Stable drag/list identity for an arrow entry: a solo arrow is keyed by its squares (matches
// the key dedupeArrows uses), a line by its line_id. Used by dnd-kit (sortable item ids) and by
// the store's reorderArrowEntries to find the entry being dragged. Agrees with arrowKey (a
// single arrow's version of this same identity, defined in board/types since ChessBoard needs
// it too) — a line member's arrowKey matches its entry's arrowEntryKey.
export function arrowEntryKey(entry: ArrowEntry): string {
  return entry.kind === 'solo' ? `${entry.arrow.from_square}-${entry.arrow.to_square}` : `line-${entry.lineId}`
}
