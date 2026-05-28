import type { StateCreator } from 'zustand'
import type { MoveClassification } from '../../../../chess/types'
import type { ChessBoardStoreType } from '../chessBoardStore'

export type OverlaySlice = {
  moveClassifications: MoveClassification[] | undefined
  openingMoveCount: number
  criticalMoveIndices: number[]

  setMoveClassifications: (classifications: MoveClassification[] | undefined) => void
  setOpeningMoveCount: (count: number) => void
  setCriticalMoveIndices: (indices: number[]) => void
}

export function getInitialOverlayState(): Pick<OverlaySlice, 'moveClassifications' | 'openingMoveCount' | 'criticalMoveIndices'> {
  return {
    moveClassifications: undefined,
    openingMoveCount: 0,
    criticalMoveIndices: [],
  }
}

export const createOverlaySlice: StateCreator<ChessBoardStoreType, [], [], OverlaySlice> = (set) => ({
  ...getInitialOverlayState(),

  setMoveClassifications: (moveClassifications) => set({ moveClassifications }),
  setOpeningMoveCount: (openingMoveCount) => set({ openingMoveCount }),
  setCriticalMoveIndices: (criticalMoveIndices) => set({ criticalMoveIndices }),
})
