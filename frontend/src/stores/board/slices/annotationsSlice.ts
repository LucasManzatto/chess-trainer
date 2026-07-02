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

export const createAnnotationsSlice: StateCreator<ChessBoardStoreType, [], [], AnnotationsSlice> = (set) => ({
  ...getInitialAnnotationsState(),

  syncAnnotations: (arrows, circles) => set({ draftArrows: arrows, draftCircles: circles, annotationsDirty: false }),
  setDraftAnnotations: (arrows, circles) => set({ draftArrows: arrows, draftCircles: circles, annotationsDirty: true }),
  markAnnotationsSaved: () => set({ annotationsDirty: false }),
})
