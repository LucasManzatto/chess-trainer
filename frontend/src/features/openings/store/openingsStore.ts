import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import type { Opening } from '../hooks/useOpenings'

interface OpeningsState {
  openings: Opening[]
  selectedOpening: Opening | null
}

interface OpeningsActions {
  setOpenings: (openings: Opening[]) => void
  setSelectedOpening: (opening: Opening | null) => void
}

export type OpeningsStoreType = OpeningsState & OpeningsActions

export function createOpeningsStore() {
  return createStore<OpeningsStoreType>()(set => ({
    openings: [],
    selectedOpening: null,
    setOpenings: openings => set({ openings }),
    setSelectedOpening: opening => set({ selectedOpening: opening }),
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
