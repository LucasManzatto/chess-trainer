import { createContext, useContext, useRef } from 'react'
import { createStore, useStore } from 'zustand'
import { Chess } from 'chess.js'
import type { HistoryEntry } from '../types'

interface ChessState {
  history: HistoryEntry[]
  currentMoveIndex: number
  chessEngine: Chess
}

interface ChessActions {
  loadMoves: (moves: string[]) => void
  applyMove: (orig: string, dest: string) => { san: string; from: string; to: string; promotion?: string; fen: string } | null
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
    chessEngine: new Chess(),

    loadMoves: (moves) => {
      const engine = new Chess()
      const entries: HistoryEntry[] = []
      for (const san of moves) {
        const move = engine.move(san)
        entries.push({ san: move.san, fen: engine.fen(), from: move.from, to: move.to })
      }
      set({ history: entries, currentMoveIndex: entries.length - 1, chessEngine: engine })
    },

    applyMove: (orig, dest) => {
      const { history, currentMoveIndex, chessEngine } = get()
      const piece = chessEngine.get(orig as Parameters<Chess['get']>[0])
      const isPromotion =
        piece?.type === 'p' &&
        ((piece.color === 'w' && dest[1] === '8') || (piece.color === 'b' && dest[1] === '1'))
      const move = chessEngine.move({ from: orig, to: dest, promotion: isPromotion ? 'q' : undefined })
      if (!move) return null

      const entry: HistoryEntry = { san: move.san, fen: chessEngine.fen(), from: move.from, to: move.to }
      const nextHistory = [...history.slice(0, currentMoveIndex + 1), entry]
      const nextEngine = new Chess(chessEngine.fen())
      set({ history: nextHistory, currentMoveIndex: nextHistory.length - 1, chessEngine: nextEngine })

      return { from: move.from, to: move.to, san: move.san, promotion: move.promotion, fen: chessEngine.fen() }
    },

    navigateBack: () => {
      const { currentMoveIndex, history } = get()
      if (currentMoveIndex < 0) return
      const nextIndex = currentMoveIndex - 1
      set({
        currentMoveIndex: nextIndex,
        chessEngine: nextIndex >= 0 ? new Chess(history[nextIndex].fen) : new Chess(),
      })
    },

    navigateForward: () => {
      const { currentMoveIndex, history } = get()
      if (currentMoveIndex >= history.length - 1) return
      const nextIndex = currentMoveIndex + 1
      set({ currentMoveIndex: nextIndex, chessEngine: new Chess(history[nextIndex].fen) })
    },

    navigateToIndex: (index) => {
      const { history } = get()
      const targetIndex = index === null ? history.length - 1 : index
      set({
        currentMoveIndex: targetIndex,
        chessEngine: targetIndex >= 0 ? new Chess(history[targetIndex].fen) : new Chess(),
      })
    },

    reset: () => set(store.getInitialState()),

    undo: () => {
      const { currentMoveIndex, history } = get()
      if (currentMoveIndex < 0) return
      const nextIndex = currentMoveIndex - 1
      const nextHistory = history.slice(0, currentMoveIndex)
      set({
        history: nextHistory,
        currentMoveIndex: nextIndex,
        chessEngine: nextIndex >= 0 ? new Chess(nextHistory[nextIndex].fen) : new Chess(),
      })
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
