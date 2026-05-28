import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BoardTheme = 'green' | 'brown' | 'blue' | 'purple' | 'ic'
export type PieceSet = 'cburnett' | 'merida' | 'alpha' | 'pirouetti' | 'chessnut' | 'chess7'

type BoardSettings = {
  boardSize: number
  showThreats: boolean
  showCoords: boolean
  theme: BoardTheme
  pieceSet: PieceSet
  soundEnabled: boolean
}

type BoardSettingsActions = {
  setBoardSize: (boardSize: number) => void
  setShowThreats: (show: boolean) => void
  setShowCoords: (show: boolean) => void
  setTheme: (theme: BoardTheme) => void
  setPieceSet: (pieceSet: PieceSet) => void
  setSoundEnabled: (enabled: boolean) => void
}

export type BoardSettingsStore = BoardSettings & BoardSettingsActions

export const useBoardSettings = create<BoardSettingsStore>()(
  persist(
    (set) => ({
      boardSize: 480,
      showThreats: false,
      showCoords: true,
      theme: 'green',
      pieceSet: 'cburnett',
      soundEnabled: true,

      setBoardSize: (boardSize) => set({ boardSize }),
      setShowThreats: (showThreats) => set({ showThreats }),
      setShowCoords: (showCoords) => set({ showCoords }),
      setTheme: (theme) => set({ theme }),
      setPieceSet: (pieceSet) => set({ pieceSet }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    { name: 'board-settings' },
  ),
)
