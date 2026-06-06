import type { StateCreator } from 'zustand'
import type { DrawBrush, DrawShape } from '@lichess-org/chessground/draw'
import type { ChessBoardStoreType } from '../chessBoardStore'

export type { DrawBrush }

export const EMPTY_BRUSHES: Record<string, DrawBrush> = {}

export type DisplaySlice = {
  orientation: 'white' | 'black'
  shapes: DrawShape[]
  hintShapes: DrawShape[]
  hintBrushes: Record<string, DrawBrush>
  customSquares: Record<string, string>
  pendingPromotion: { from: string; to: string } | null
  interactive: boolean

  setOrientation: (orientation: 'white' | 'black') => void
  flipOrientation: () => void
  setShapes: (shapes: DrawShape[]) => void
  setHintShapes: (shapes: DrawShape[], brushes?: Record<string, DrawBrush>) => void
  setCustomSquares: (squares: Record<string, string>) => void
  setPendingPromotion: (promotion: { from: string; to: string } | null) => void
  setInteractive: (interactive: boolean) => void
}

export type DisplaySliceConfig = {
  orientation?: 'white' | 'black'
  interactive?: boolean
}

export function getInitialDisplayState(config: DisplaySliceConfig = {}): Pick<DisplaySlice,
  'orientation' | 'shapes' | 'hintShapes' | 'hintBrushes' | 'customSquares' | 'pendingPromotion' | 'interactive'
> {
  return {
    orientation: config.orientation ?? 'white',
    shapes: [],
    hintShapes: [],
    hintBrushes: EMPTY_BRUSHES,
    customSquares: {},
    pendingPromotion: null,
    interactive: config.interactive ?? true,
  }
}

export function createDisplaySlice(config: DisplaySliceConfig = {}): StateCreator<ChessBoardStoreType, [], [], DisplaySlice> {
  return (set) => ({
    ...getInitialDisplayState(config),

    setOrientation: (orientation) => set({ orientation }),
    flipOrientation: () => set(s => ({ orientation: s.orientation === 'white' ? 'black' : 'white' })),
    setShapes: (shapes) => set({ shapes }),
    setHintShapes: (hintShapes, brushes) => set({ hintShapes, hintBrushes: brushes ?? EMPTY_BRUSHES }),
    setCustomSquares: (customSquares) => set({ customSquares }),
    setPendingPromotion: (pendingPromotion) => set({ pendingPromotion }),
    setInteractive: (interactive) => set({ interactive }),
  })
}
