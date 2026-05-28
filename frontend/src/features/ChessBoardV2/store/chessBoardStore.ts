import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import { buildHistoryFromMoves } from '../../../chess/game'
import { createGameSlice, getInitialGameState, type GameSlice } from './slices/gameSlice'
import { createDisplaySlice, getInitialDisplayState, type DisplaySlice, type DisplaySliceConfig } from './slices/displaySlice'
import { createOverlaySlice, getInitialOverlayState, type OverlaySlice } from './slices/overlaySlice'
import { createEvalSlice, getInitialEvalState, type EvalSlice } from './slices/evalSlice'

export type ChessBoardStoreType = GameSlice & DisplaySlice & OverlaySlice & EvalSlice & {
  loadOpeningMoves: (moves: string[]) => void
  reset: () => void
}

export type ChessBoardStoreConfig = DisplaySliceConfig

export function createChessBoardStore(config: ChessBoardStoreConfig = {}) {
  return createStore<ChessBoardStoreType>()((set, get, store) => ({
    ...createGameSlice(set, get, store),
    ...createDisplaySlice(set, get, store),
    ...createOverlaySlice(set, get, store),
    ...createEvalSlice(set, get, store),

    // Apply config overrides on top of slice defaults
    orientation: config.orientation ?? 'white',
    interactive: config.interactive ?? true,

    // Cross-slice action: resets game state and clears display hints atomically
    loadOpeningMoves: (moves) => {
      const history = buildHistoryFromMoves(moves)
      set({ history, currentMoveIndex: history.length - 1, lastExternalFen: null, hintShapes: [] })
    },

    reset: () => set({
      ...getInitialGameState(),
      ...getInitialDisplayState(),
      ...getInitialOverlayState(),
      ...getInitialEvalState(),
      orientation: get().orientation,
      interactive: get().interactive,
    }),
  }))
}

type ChessBoardStoreApi = ReturnType<typeof createChessBoardStore>

const ChessBoardStoreContext = createContext<ChessBoardStoreApi | null>(null)

export function useChessBoardStoreApi(): ChessBoardStoreApi {
  const store = useContext(ChessBoardStoreContext)
  if (!store) throw new Error('useChessBoardStore must be used inside ChessBoardV2Provider')
  return store
}

export function useChessBoardStore<T>(selector: (state: ChessBoardStoreType) => T): T {
  return useStore(useChessBoardStoreApi(), selector)
}

export { ChessBoardStoreContext }
