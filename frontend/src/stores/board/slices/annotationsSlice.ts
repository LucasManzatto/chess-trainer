import type { StateCreator } from 'zustand'
import type { BoardAnnotationArrow, BoardAnnotationCircle } from '../../../features/board/types'
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

export const createAnnotationsSlice: StateCreator<ChessBoardStoreType, [], [], AnnotationsSlice> = (set) => ({
  ...getInitialAnnotationsState(),

  syncAnnotations: (arrows, circles) =>
    set({ draftArrows: dedupeArrows(arrows), draftCircles: circles, annotationsDirty: false }),
  setDraftAnnotations: (arrows, circles) =>
    set({ draftArrows: dedupeArrows(arrows), draftCircles: circles, annotationsDirty: true }),
  markAnnotationsSaved: () => set({ annotationsDirty: false }),
})
