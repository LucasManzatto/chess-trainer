import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import { createGameSlice, getInitialGameState, type GameSlice } from './slices/gameSlice'
import { createDisplaySlice, getInitialDisplayState, type DisplaySlice, type DisplaySliceConfig } from './slices/displaySlice'
import { createOverlaySlice, getInitialOverlayState, type OverlaySlice } from './slices/overlaySlice'
import { createEvalSlice, getInitialEvalState, type EvalSlice } from './slices/evalSlice'

export type ChessBoardStoreType = GameSlice & DisplaySlice & OverlaySlice & EvalSlice & {
  reset: () => void
}

export type ChessBoardStoreConfig = DisplaySliceConfig

export function createChessBoardStore(config: ChessBoardStoreConfig = {}) {
  return createStore<ChessBoardStoreType>()((set, get, store) => ({
    ...createGameSlice(set, get, store),
    ...createDisplaySlice(config)(set, get, store),
    ...createOverlaySlice(set, get, store),
    ...createEvalSlice(set, get, store),

    reset: () => set({
      ...getInitialGameState(),
      ...getInitialDisplayState({ orientation: get().orientation, interactive: get().interactive }),
      ...getInitialOverlayState(),
      ...getInitialEvalState(),
    }),
  }))
}

type ChessBoardStoreApi = ReturnType<typeof createChessBoardStore>

const ChessBoardStoreContext = createContext<ChessBoardStoreApi | null>(null)

export function useChessBoardStoreApi(): ChessBoardStoreApi {
  const store = useContext(ChessBoardStoreContext)
  if (!store) throw new Error('useChessBoardStore must be used inside ChessBoardProvider')
  return store
}

export function useChessBoardStore<T>(selector: (state: ChessBoardStoreType) => T): T {
  return useStore(useChessBoardStoreApi(), selector)
}

export { ChessBoardStoreContext }
