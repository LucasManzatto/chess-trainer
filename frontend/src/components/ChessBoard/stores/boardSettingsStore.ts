import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BoardSettingsStore = {
  size: number
  setSize: (size: number) => void
}

export const DEFAULT_BOARD_SIZE = 500

export const useBoardSettingsStore = create<BoardSettingsStore>()(
  persist(
    (set) => ({
      size: DEFAULT_BOARD_SIZE,
      setSize: (size) => set({ size }),
    }),
    { name: 'board-settings' },
  ),
)
