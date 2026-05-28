import type { StateCreator } from 'zustand'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { ChessBoardStoreType } from '../chessBoardStore'

export type DisplaySlice = {
  orientation: 'white' | 'black'
  shapes: DrawShape[]
  hintShapes: DrawShape[]
  customSquares: Record<string, string>
  pendingPromotion: { from: string; to: string } | null
  interactive: boolean

  setOrientation: (orientation: 'white' | 'black') => void
  flipOrientation: () => void
  setShapes: (shapes: DrawShape[]) => void
  setHintShapes: (shapes: DrawShape[]) => void
  setCustomSquares: (squares: Record<string, string>) => void
  setPendingPromotion: (promotion: { from: string; to: string } | null) => void
  setInteractive: (interactive: boolean) => void
}

export type DisplaySliceConfig = {
  orientation?: 'white' | 'black'
  interactive?: boolean
}

export function getInitialDisplayState(): Pick<DisplaySlice,
  'orientation' | 'shapes' | 'hintShapes' | 'customSquares' | 'pendingPromotion' | 'interactive'
> {
  return {
    orientation: 'white',
    shapes: [],
    hintShapes: [],
    customSquares: {},
    pendingPromotion: null,
    interactive: true,
  }
}

export const createDisplaySlice: StateCreator<ChessBoardStoreType, [], [], DisplaySlice> = (set) => ({
  ...getInitialDisplayState(),

  setOrientation: (orientation) => set({ orientation }),
  flipOrientation: () => set(s => ({ orientation: s.orientation === 'white' ? 'black' : 'white' })),
  setShapes: (shapes) => set({ shapes }),
  setHintShapes: (hintShapes) => set({ hintShapes }),
  setCustomSquares: (customSquares) => set({ customSquares }),
  setPendingPromotion: (pendingPromotion) => set({ pendingPromotion }),
  setInteractive: (interactive) => set({ interactive }),
})
