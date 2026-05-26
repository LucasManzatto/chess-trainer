import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type RouteMemoryStore = {
  routes: Record<string, Record<string, unknown>>
  save: (pathname: string, search: Record<string, unknown>) => void
}

export const useRouteMemoryStore = create<RouteMemoryStore>()(
  persist(
    (set) => ({
      routes: {},
      save: (pathname, search) =>
        set((state) => ({ routes: { ...state.routes, [pathname]: search } })),
    }),
    { name: 'route-memory' },
  ),
)
