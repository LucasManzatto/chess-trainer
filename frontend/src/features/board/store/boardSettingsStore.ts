import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BoardTheme = 'green' | 'brown' | 'blue' | 'purple' | 'ic'
export type PieceSet = 'cburnett' | 'merida' | 'alpha' | 'pirouetti' | 'chessnut' | 'chess7'
export type MoveStatDisplay = 'winrate' | 'frequency'

export interface BoardConfig {
  readonly showThreats: boolean
  readonly showBestMove: boolean
  readonly boardSize: number
  readonly moveStatDisplay: MoveStatDisplay
}

type BoardSettings = {
  boardSize: number
  showThreats: boolean
  showCoords: boolean
  showBestMove: boolean
  theme: BoardTheme
  pieceSet: PieceSet
  soundEnabled: boolean
  moveStatDisplay: MoveStatDisplay
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
  setMoveStatDisplay: (display: MoveStatDisplay) => void
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
      moveStatDisplay: 'winrate',

      setConfig: (patch) => set(patch),
      setBoardSize: (boardSize) => set({ boardSize }),
      setShowThreats: (showThreats) => set({ showThreats }),
      setShowCoords: (showCoords) => set({ showCoords }),
      setShowBestMove: (showBestMove) => set({ showBestMove }),
      setTheme: (theme) => set({ theme }),
      setPieceSet: (pieceSet) => set({ pieceSet }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setMoveStatDisplay: (moveStatDisplay) => set({ moveStatDisplay }),
    }),
    { name: 'board-settings' },
  ),
)
