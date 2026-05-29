import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import type { Opening } from '../types'

interface OpeningsState {
  openings: Opening[]
  selectedOpening: Opening | null
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

export function createOpeningsStore() {
  return createStore<OpeningsStoreType>()((set, get) => ({
    openings: [],
    selectedOpening: null,
    selectionHistory: [],
    historyIndex: -1,

    setOpenings: openings => set({ openings }),

    setSelectedOpening: opening => set(state => {
      if (opening === null) return { selectedOpening: null }
      // Don't push if same opening re-selected
      if (state.selectedOpening?.id === opening.id) return {}

      const truncated = state.selectionHistory.slice(0, state.historyIndex + 1)
      const next = [...truncated, opening]
      return {
        selectedOpening: opening,
        selectionHistory: next,
        historyIndex: next.length - 1,
      }
    }),

    navigateBack: () => set(state => {
      const idx = state.historyIndex - 1
      if (idx < 0) return {}
      return { historyIndex: idx, selectedOpening: state.selectionHistory[idx] }
    }),

    navigateForward: () => set(state => {
      const idx = state.historyIndex + 1
      if (idx >= state.selectionHistory.length) return {}
      return { historyIndex: idx, selectedOpening: state.selectionHistory[idx] }
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
