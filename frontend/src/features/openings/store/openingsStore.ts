import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import type { Opening } from '../types'

interface OpeningsState {
  openings: Opening[]
  selectionHistory: Opening[]
  historyIndex: number
}

interface OpeningsActions {
  setOpenings: (openings: Opening[]) => void
  setSelectedOpening: (opening: Opening | null) => void
  navigateBack: () => void
  navigateForward: () => void
}

export type OpeningsStoreType = OpeningsState & OpeningsActions

export function getSelectedOpening(state: OpeningsStoreType): Opening | null {
  return state.historyIndex >= 0 ? state.selectionHistory[state.historyIndex] : null
}

export function createOpeningsStore() {
  return createStore<OpeningsStoreType>()((set) => ({
    openings: [],
    selectionHistory: [],
    historyIndex: -1,

    setOpenings: openings => set({ openings }),

    setSelectedOpening: opening => set(state => {
      if (opening === null) return { selectionHistory: [], historyIndex: -1 }
      const current = getSelectedOpening(state)
      if (current?.id === opening.id) return {}

      const truncated = state.selectionHistory.slice(0, state.historyIndex + 1)
      const next = [...truncated, opening]
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
