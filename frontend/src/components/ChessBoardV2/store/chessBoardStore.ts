import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { EvaluationScore } from '../../../chess/types'
import {
  buildHistoryFromMoves,
  applyMoveToPosition,
  getFenAtIndex,
  undoLastMove,
} from '../../../chess/game'
import { Chess } from 'chess.js'
import type { HistoryEntry, MoveResult, MoveClassification } from '../../../chess/types'

interface ChessBoardState {
  // Game
  history: HistoryEntry[]
  currentMoveIndex: number

  // Board display
  orientation: 'white' | 'black'
  shapes: DrawShape[]
  customSquares: Record<string, string>

  // Analysis overlay
  moveClassifications: MoveClassification[] | undefined
  openingMoveCount: number
  criticalMoveIndices: number[]

  // Settings
  interactive: boolean
  showThreats: boolean
  boardSize: number

  // Evaluation
  evalScore: EvaluationScore | undefined
  evalBestMove: string | undefined

  // Tracks FEN loaded externally (opening select, position setup) vs player moves.
  // Consumers can diff against history to avoid stale auto-select side effects.
  lastExternalFen: string | null

  // Promotion pending: set when a pawn reaches the back rank before piece is chosen.
  pendingPromotion: { from: string; to: string } | null
}

interface ChessBoardActions {
  // Game
  loadMoves: (moves: string[]) => void
  loadFen: (fen: string) => void
  applyMove: (orig: string, dest: string) => MoveResult | null
  navigateBack: () => void
  navigateForward: () => void
  navigateToIndex: (index: number | null) => void
  reset: () => void
  undo: () => void

  // Board display
  setOrientation: (orientation: 'white' | 'black') => void
  flipOrientation: () => void
  setShapes: (shapes: DrawShape[]) => void
  setCustomSquares: (squares: Record<string, string>) => void

  // Analysis overlay
  setMoveClassifications: (classifications: MoveClassification[] | undefined) => void
  setOpeningMoveCount: (count: number) => void
  setCriticalMoveIndices: (indices: number[]) => void

  // Settings
  setInteractive: (interactive: boolean) => void
  setShowThreats: (show: boolean) => void
  setBoardSize: (size: number) => void

  // Evaluation
  setEvaluation: (score: EvaluationScore | undefined, bestMove: string | undefined) => void

  // Promotion
  setPendingPromotion: (promotion: { from: string; to: string } | null) => void
}

export type ChessBoardStoreType = ChessBoardState & ChessBoardActions

const INITIAL_FEN = new Chess().fen()

function getInitialState(): ChessBoardState {
  return {
    history: [],
    currentMoveIndex: -1,
    orientation: 'white',
    shapes: [],
    customSquares: {},
    moveClassifications: undefined,
    openingMoveCount: 0,
    criticalMoveIndices: [],
    interactive: true,
    showThreats: false,
    boardSize: 480,
    evalScore: undefined,
    evalBestMove: undefined,
    lastExternalFen: null,
    pendingPromotion: null,
  }
}

export type ChessBoardStoreConfig = {
  orientation?: 'white' | 'black'
  interactive?: boolean
  showThreats?: boolean
}

export function createChessBoardStore(config: ChessBoardStoreConfig = {}) {
  return createStore<ChessBoardStoreType>()((set, get) => ({
    ...getInitialState(),
    orientation: config.orientation ?? 'white',
    interactive: config.interactive ?? true,
    showThreats: config.showThreats ?? false,
    boardSize: 480,

    loadMoves: (moves) => {
      const history = buildHistoryFromMoves(moves)
      set({ history, currentMoveIndex: history.length - 1, lastExternalFen: null })
    },

    loadFen: (fen) => {
      set({ history: [], currentMoveIndex: -1, lastExternalFen: fen })
    },

    applyMove: (orig, dest) => {
      const { history, currentMoveIndex } = get()
      const currentFen = getFenAtIndex(history, currentMoveIndex)
      const result = applyMoveToPosition(currentFen, history, currentMoveIndex, orig, dest)
      if (!result) return null
      set({ history: result.history, currentMoveIndex: result.newIndex, lastExternalFen: null })
      return { from: result.entry.from, to: result.entry.to, san: result.entry.san, fen: result.entry.fen }
    },

    navigateBack: () => {
      const { currentMoveIndex } = get()
      if (currentMoveIndex < 0) return
      set({ currentMoveIndex: currentMoveIndex - 1 })
    },

    navigateForward: () => {
      const { currentMoveIndex, history } = get()
      if (currentMoveIndex >= history.length - 1) return
      set({ currentMoveIndex: currentMoveIndex + 1 })
    },

    navigateToIndex: (index) => {
      const { history } = get()
      const targetIndex = index === null ? history.length - 1 : index
      set({ currentMoveIndex: targetIndex })
    },

    reset: () => set({ ...getInitialState(), orientation: get().orientation, interactive: get().interactive, showThreats: get().showThreats }),

    undo: () => {
      const { history, currentMoveIndex } = get()
      const { history: nextHistory, newIndex } = undoLastMove(history, currentMoveIndex)
      set({ history: nextHistory, currentMoveIndex: newIndex })
    },

    setOrientation: (orientation) => set({ orientation }),

    flipOrientation: () => set(s => ({ orientation: s.orientation === 'white' ? 'black' : 'white' })),

    setShapes: (shapes) => set({ shapes }),

    setCustomSquares: (customSquares) => set({ customSquares }),

    setMoveClassifications: (moveClassifications) => set({ moveClassifications }),

    setOpeningMoveCount: (openingMoveCount) => set({ openingMoveCount }),

    setCriticalMoveIndices: (criticalMoveIndices) => set({ criticalMoveIndices }),

    setInteractive: (interactive) => set({ interactive }),

    setShowThreats: (showThreats) => set({ showThreats }),

    setBoardSize: (boardSize) => set({ boardSize }),

    setEvaluation: (evalScore, evalBestMove) => set({ evalScore, evalBestMove }),

    setPendingPromotion: (pendingPromotion) => set({ pendingPromotion }),
  }))
}

type ChessBoardStoreApi = ReturnType<typeof createChessBoardStore>

const ChessBoardStoreContext = createContext<ChessBoardStoreApi | null>(null)

export function useChessBoardStoreApi(): ChessBoardStoreApi {
  const store = useContext(ChessBoardStoreContext)
  if (!store) throw new Error('useChessBoardStore must be used inside ChessBoardV2Provider')
  return store
}

export function useChessBoardStore<T>(selector: (state: ChessBoardStoreType) => T): T {
  return useStore(useChessBoardStoreApi(), selector)
}

export { ChessBoardStoreContext, INITIAL_FEN }
