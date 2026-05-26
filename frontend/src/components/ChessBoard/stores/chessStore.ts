import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'
import {
  buildHistoryFromMoves,
  applyMoveToPosition,
  getFenAtIndex,
  undoLastMove,
} from '../../../chess/game'
import type { HistoryEntry, MoveResult } from '../../../chess/types'

interface ChessState {
  history: HistoryEntry[]
  currentMoveIndex: number
}

interface ChessActions {
  loadMoves: (moves: string[]) => void
  applyMove: (orig: string, dest: string) => MoveResult | null
  navigateBack: () => void
  navigateForward: () => void
  navigateToIndex: (index: number | null) => void
  reset: () => void
  undo: () => void
}

export type ChessStore = ChessState & ChessActions

function createChessStore() {
  return createStore<ChessStore>()((set, get, store) => ({
    history: [],
    currentMoveIndex: -1,

    loadMoves: (moves) => {
      const history = buildHistoryFromMoves(moves)
      set({ history, currentMoveIndex: history.length - 1 })
    },

    applyMove: (orig, dest) => {
      const { history, currentMoveIndex } = get()
      const currentFen = getFenAtIndex(history, currentMoveIndex)
      const result = applyMoveToPosition(currentFen, history, currentMoveIndex, orig, dest)
      if (!result) return null
      set({ history: result.history, currentMoveIndex: result.newIndex })
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

    reset: () => set(store.getInitialState()),

    undo: () => {
      const { history, currentMoveIndex } = get()
      const { history: nextHistory, newIndex } = undoLastMove(history, currentMoveIndex)
      set({ history: nextHistory, currentMoveIndex: newIndex })
    },
  }))
}

type ChessStoreApi = ReturnType<typeof createChessStore>

const ChessStoreContext = createContext<ChessStoreApi | null>(null)

export function useChessStoreApi(): ChessStoreApi {
  const store = useContext(ChessStoreContext)
  if (!store) throw new Error('useChessStore must be used inside ChessStoreProvider')
  return store
}

export function useChessStore<T>(selector: (state: ChessStore) => T): T {
  return useStore(useChessStoreApi(), selector)
}

export { ChessStoreContext, createChessStore }
