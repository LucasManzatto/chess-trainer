import type { StateCreator } from 'zustand'
import type { AnnotationLinePatch, BoardAnnotationArrow, BoardAnnotationCircle } from '../../../features/board/types'
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
  reorderLine: (lineId: string, index: number, direction: 'up' | 'down') => void
  deleteLine: (lineId: string) => void
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
  for (const a of arrows) byKey.set(`${a.from_square}-${a.to_square}`, a)
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
  reorderLine: (lineId, index, direction) => {
    const arrows = get().draftArrows
    const members = arrows
      .map((a, i) => ({ a, i }))
      .filter(m => m.a.line_id === lineId)
      .sort((x, y) => (x.a.order ?? 0) - (y.a.order ?? 0))
    const pos = members.findIndex(m => m.i === index)
    const swapPos = direction === 'up' ? pos - 1 : pos + 1
    if (pos === -1 || swapPos < 0 || swapPos >= members.length) return
    const a = members[pos]
    const b = members[swapPos]
    get().setDraftAnnotations(
      arrows.map((arrow, i) => {
        if (i === a.i) return { ...arrow, order: b.a.order }
        if (i === b.i) return { ...arrow, order: a.a.order }
        return arrow
      }),
      get().draftCircles,
    )
  },
  deleteLine: (lineId) =>
    get().setDraftAnnotations(
      get().draftArrows.filter(a => a.line_id !== lineId),
      get().draftCircles,
    ),
})
