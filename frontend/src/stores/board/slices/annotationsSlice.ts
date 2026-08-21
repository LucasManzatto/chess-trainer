import type { StateCreator } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
import type { AnnotationLinePatch, BoardAnnotationArrow, BoardAnnotationCircle } from '../../../features/board/types'
import { arrowEntryKey, groupArrowEntries } from '../../../features/openings/lib/annotationEntries'
import type { ChessBoardStoreType } from '../chessBoardStore'

export type AnnotationsState = {
  draftArrows: BoardAnnotationArrow[]
  draftCircles: BoardAnnotationCircle[]
  annotationsDirty: boolean
}

export type AnnotationsActions = {
  syncAnnotations: (arrows: BoardAnnotationArrow[], circles: BoardAnnotationCircle[]) => void
  setDraftAnnotations: (arrows: BoardAnnotationArrow[], circles: BoardAnnotationCircle[]) => void
  markAnnotationsSaved: () => void
  updateArrow: (index: number, patch: Partial<BoardAnnotationArrow>) => void
  updateCircle: (index: number, patch: Partial<BoardAnnotationCircle>) => void
  deleteArrow: (index: number) => void
  deleteCircle: (index: number) => void
  // Chains arrow `indexA` (or its line's last member) to `indexB`, giving both the same line_id.
  linkArrows: (indexA: number, indexB: number) => void
  // Pulls an arrow out of its line; dissolves the line entirely if only one member is left.
  unlinkArrow: (index: number) => void
  updateLine: (lineId: string, patch: AnnotationLinePatch) => void
  // Drags a line's member arrow (identified by its draftArrows index) to another member's
  // position within the same line. Reassigns `order` 1..N to every member to match the new
  // sequence.
  reorderLineMembers: (lineId: string, activeIndex: number, overIndex: number) => void
  deleteLine: (lineId: string) => void
  // Drags a row (solo arrow or whole chained line, keyed by arrowEntryKey) to another row's
  // position in AnnotationsList. Moves the entry as a block — a line's members keep their
  // relative order and `order` values, only the block's position in draftArrows changes.
  reorderArrowEntries: (activeKey: string, overKey: string) => void
  // Drags a circle (keyed by its square) to another circle's position.
  reorderCircles: (activeSquare: string, overSquare: string) => void
}

export type AnnotationsSlice = AnnotationsState & AnnotationsActions

export function getInitialAnnotationsState(): AnnotationsState {
  return {
    draftArrows: [],
    draftCircles: [],
    annotationsDirty: false,
  }
}

function dedupeArrows(arrows: BoardAnnotationArrow[]): BoardAnnotationArrow[] {
  const byKey = new Map<string, BoardAnnotationArrow>()
  for (const a of arrows) {
    const key = `${a.from_square}-${a.to_square}`
    // Delete-then-set (rather than a plain set) so a duplicate key's re-insertion moves it to
    // its new position in Map iteration order — a plain set() on an existing key keeps its old
    // position, which would silently undo a drag-reorder that doesn't change any keys.
    byKey.delete(key)
    byKey.set(key, a)
  }
  return [...byKey.values()]
}

export const createAnnotationsSlice: StateCreator<ChessBoardStoreType, [], [], AnnotationsSlice> = (set, get) => ({
  ...getInitialAnnotationsState(),

  syncAnnotations: (arrows, circles) =>
    set({ draftArrows: dedupeArrows(arrows), draftCircles: circles, annotationsDirty: false }),
  setDraftAnnotations: (arrows, circles) =>
    set({ draftArrows: dedupeArrows(arrows), draftCircles: circles, annotationsDirty: true }),
  markAnnotationsSaved: () => set({ annotationsDirty: false }),

  updateArrow: (index, patch) =>
    get().setDraftAnnotations(
      get().draftArrows.map((a, i) => (i === index ? { ...a, ...patch } : a)),
      get().draftCircles,
    ),
  updateCircle: (index, patch) =>
    get().setDraftAnnotations(
      get().draftArrows,
      get().draftCircles.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    ),
  deleteArrow: (index) =>
    get().setDraftAnnotations(
      get().draftArrows.filter((_, i) => i !== index),
      get().draftCircles,
    ),
  deleteCircle: (index) =>
    get().setDraftAnnotations(
      get().draftArrows,
      get().draftCircles.filter((_, i) => i !== index),
    ),
  linkArrows: (indexA, indexB) => {
    const arrows = get().draftArrows
    const lineId = arrows[indexA].line_id ?? crypto.randomUUID()
    const memberOrders = arrows.filter(a => a.line_id === lineId).map(a => a.order ?? 0)
    const nextOrder = (memberOrders.length ? Math.max(...memberOrders) : 0) + 1
    get().setDraftAnnotations(
      arrows.map((a, i) => {
        if (i === indexB) return { ...a, line_id: lineId, order: nextOrder }
        if (i === indexA && a.line_id == null) return { ...a, line_id: lineId, order: 1 }
        return a
      }),
      get().draftCircles,
    )
  },
  unlinkArrow: (index) => {
    const arrows = get().draftArrows
    const lineId = arrows[index].line_id
    const pulled = arrows.map((a, i) => (i === index ? { ...a, line_id: null, order: null } : a))
    // Dissolve the line entirely if only one member is left — nothing to chain anymore.
    const remaining = pulled.filter(a => a.line_id === lineId)
    const result = remaining.length === 1
      ? pulled.map(a => (a.line_id === lineId ? { ...a, line_id: null, order: null } : a))
      : pulled
    get().setDraftAnnotations(result, get().draftCircles)
  },
  updateLine: (lineId, patch) =>
    get().setDraftAnnotations(
      get().draftArrows.map(a => (a.line_id === lineId ? { ...a, ...patch } : a)),
      get().draftCircles,
    ),
  reorderLineMembers: (lineId, activeIndex, overIndex) => {
    const arrows = get().draftArrows
    const members = arrows
      .map((a, i) => ({ a, i }))
      .filter(m => m.a.line_id === lineId)
      .sort((x, y) => (x.a.order ?? 0) - (y.a.order ?? 0))
    const activePos = members.findIndex(m => m.i === activeIndex)
    const overPos = members.findIndex(m => m.i === overIndex)
    if (activePos === -1 || overPos === -1) return
    const reordered = arrayMove(members, activePos, overPos)
    const orderByIndex = new Map(reordered.map((m, pos) => [m.i, pos + 1]))
    get().setDraftAnnotations(
      arrows.map((a, i) => (orderByIndex.has(i) ? { ...a, order: orderByIndex.get(i)! } : a)),
      get().draftCircles,
    )
  },
  deleteLine: (lineId) =>
    get().setDraftAnnotations(
      get().draftArrows.filter(a => a.line_id !== lineId),
      get().draftCircles,
    ),
  reorderArrowEntries: (activeKey, overKey) => {
    const entries = groupArrowEntries(get().draftArrows)
    const activeIndex = entries.findIndex(e => arrowEntryKey(e) === activeKey)
    const overIndex = entries.findIndex(e => arrowEntryKey(e) === overKey)
    if (activeIndex === -1 || overIndex === -1) return
    const reordered = arrayMove(entries, activeIndex, overIndex)
    const flatArrows = reordered.flatMap(e => (e.kind === 'solo' ? [e.arrow] : e.members.map(m => m.arrow)))
    get().setDraftAnnotations(flatArrows, get().draftCircles)
  },
  reorderCircles: (activeSquare, overSquare) => {
    const circles = get().draftCircles
    const activeIndex = circles.findIndex(c => c.square === activeSquare)
    const overIndex = circles.findIndex(c => c.square === overSquare)
    if (activeIndex === -1 || overIndex === -1) return
    get().setDraftAnnotations(get().draftArrows, arrayMove(circles, activeIndex, overIndex))
  },
})
