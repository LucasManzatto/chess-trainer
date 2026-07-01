import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import type { Position } from '../../features/openings/types'

interface OpeningsState {
  positions: Position[]
  selectionHistory: Position[]
  historyIndex: number
}

interface OpeningsActions {
  setPositions: (positions: Position[]) => void
  setSelectedPosition: (position: Position | null) => void
  navigateBack: () => void
  navigateForward: () => void
}

export type OpeningsStoreType = OpeningsState & OpeningsActions

export function getSelectedPosition(state: OpeningsStoreType): Position | null {
  return (state.historyIndex >= 0 ? state.selectionHistory[state.historyIndex] : null) ?? null
}

/** @deprecated use getSelectedPosition */
export const getSelectedOpening = getSelectedPosition

export function createOpeningsStore() {
  return createStore<OpeningsStoreType>()((set) => ({
    positions: [],
    selectionHistory: [],
    historyIndex: -1,

    setPositions: positions => set({ positions }),

    setSelectedPosition: position => set(state => {
      if (position === null) return { selectionHistory: [], historyIndex: -1 }
      const current = getSelectedPosition(state)
      if (current?.fen === position.fen) return {}

      const truncated = state.selectionHistory.slice(0, state.historyIndex + 1)
      const next = [...truncated, position]
      return { selectionHistory: next, historyIndex: next.length - 1 }
    }),

    navigateBack: () => set(state => {
      const idx = state.historyIndex - 1
      if (idx < 0) return {}
      return { historyIndex: idx }
    }),

    navigateForward: () => set(state => {
      const idx = state.historyIndex + 1
      if (idx >= state.selectionHistory.length) return {}
      return { historyIndex: idx }
    }),
  }))
}

type OpeningsStoreApi = ReturnType<typeof createOpeningsStore>

const OpeningsStoreContext = createContext<OpeningsStoreApi | null>(null)

export function useOpeningsStoreApi(): OpeningsStoreApi {
  const store = useContext(OpeningsStoreContext)
  if (!store) throw new Error('useOpeningsStore must be used inside OpeningsStoreProvider')
  return store
}

export function useOpeningsStore<T>(selector: (state: OpeningsStoreType) => T): T {
  return useStore(useOpeningsStoreApi(), selector)
}

export { OpeningsStoreContext }
