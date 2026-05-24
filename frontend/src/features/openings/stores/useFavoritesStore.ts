import { create } from 'zustand'

type FavoritesStore = {
  ids: Set<number>
  isLoaded: boolean
  setAll: (ids: number[]) => void
  toggle: (id: number) => void
}

export const useFavoritesStore = create<FavoritesStore>((set) => ({
  ids: new Set(),
  isLoaded: false,

  setAll: (ids) => set({ ids: new Set(ids), isLoaded: true }),

  toggle: (id) =>
    set((state) => {
      const next = new Set(state.ids)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ids: next }
    }),
}))
