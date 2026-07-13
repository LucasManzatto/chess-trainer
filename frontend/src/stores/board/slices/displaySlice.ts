import type { StateCreator } from 'zustand'
import type { DrawBrush } from '@lichess-org/chessground/draw'
import type { ChessBoardStoreType } from '../chessBoardStore'

export type { DrawBrush }

export const EMPTY_BRUSHES: Record<string, DrawBrush> = {}

// TODO: shapes/hintShapes/hintBrushes/drawnShapes/shapesClearSignal/customSquares/pendingPromotion
// removed from this slice — any consumer relying on them (drawing, hints, promotion dialog) is broken.
export type DisplaySlice = {
  orientation: 'white' | 'black'
  interactive: boolean

  setOrientation: (orientation: 'white' | 'black') => void
  flipOrientation: () => void
  setInteractive: (interactive: boolean) => void
}

export type DisplaySliceConfig = {
  orientation?: 'white' | 'black'
  interactive?: boolean
}

export function getInitialDisplayState(): Pick<DisplaySlice,
  'orientation' | 'interactive'
> {
  return {
    orientation: 'white',
    interactive: true,
  }
}

export function createDisplaySlice(config: DisplaySliceConfig = {}): StateCreator<ChessBoardStoreType, [], [], DisplaySlice> {
  return (set) => ({
    ...getInitialDisplayState(),
    orientation: config.orientation ?? 'white',
    interactive: config.interactive ?? true,

    setOrientation: (orientation) => set({ orientation }),
    flipOrientation: () => set(s => ({ orientation: s.orientation === 'white' ? 'black' : 'white' })),
    setInteractive: (interactive) => set({ interactive }),
  })
}
