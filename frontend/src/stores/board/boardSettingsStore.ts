import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BoardTheme = 'green' | 'brown' | 'blue' | 'purple' | 'ic'
export type PieceSet = 'cburnett' | 'merida' | 'alpha' | 'pirouetti' | 'chessnut' | 'chess7'

export interface BoardConfig {
  readonly showThreats: boolean
  readonly showBestMove: boolean
  readonly boardSize: number
}

type BoardSettings = {
  boardSize: number
  showThreats: boolean
  showCoords: boolean
  showBestMove: boolean
  theme: BoardTheme
  pieceSet: PieceSet
  soundEnabled: boolean
}

type BoardSettingsActions = {
  setConfig: (patch: Partial<BoardConfig>) => void
  setBoardSize: (boardSize: number) => void
  setShowThreats: (show: boolean) => void
  setShowCoords: (show: boolean) => void
  setShowBestMove: (show: boolean) => void
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
      showBestMove: true,
      theme: 'green',
      pieceSet: 'cburnett',
      soundEnabled: true,

      setConfig: (patch) => set(patch),
      setBoardSize: (boardSize) => set({ boardSize }),
      setShowThreats: (showThreats) => set({ showThreats }),
      setShowCoords: (showCoords) => set({ showCoords }),
      setShowBestMove: (showBestMove) => set({ showBestMove }),
      setTheme: (theme) => set({ theme }),
      setPieceSet: (pieceSet) => set({ pieceSet }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    { name: 'board-settings' },
  ),
)
