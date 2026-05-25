import { create } from 'zustand'
import { Chess } from 'chess.js'
import type { MoveResult, GameOverResult, HistoryEntry } from '../types'

interface ChessState {
  history: HistoryEntry[]
  currentMoveIndex: number
  chessEngine: Chess

  loadMoves: (moves: string[]) => void
  executeStepMove: (orig: string, dest: string, onMove?: (m: MoveResult) => void, onGameOver?: (g: GameOverResult) => void) => void
  navigateBack: () => void
  navigateForward: () => void
  navigateToIndex: (index: number | null) => void
  reset: () => void
  undo: () => void
}

export const useChessStore = create<ChessState>((set, get) => ({
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

  executeStepMove: (orig, dest, onMove, onGameOver) => {
    const { history, currentMoveIndex, chessEngine } = get()
    const piece = chessEngine.get(orig as Parameters<Chess['get']>[0])
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && dest[1] === '8') || (piece.color === 'b' && dest[1] === '1'))
    const move = chessEngine.move({ from: orig, to: dest, promotion: isPromotion ? 'q' : undefined })
    if (!move) return

    const entry: HistoryEntry = { san: move.san, fen: chessEngine.fen(), from: move.from, to: move.to }
    const nextHistory = [...history.slice(0, currentMoveIndex + 1), entry]
    const nextIndex = nextHistory.length - 1

    set({ history: nextHistory, currentMoveIndex: nextIndex })

    onMove?.({ from: move.from, to: move.to, san: move.san, promotion: move.promotion, fen: chessEngine.fen() })

    if (chessEngine.isGameOver()) {
      if (chessEngine.isCheckmate()) {
        onGameOver?.({ result: 'checkmate', winner: chessEngine.turn() === 'w' ? 'b' : 'w' })
      } else if (chessEngine.isStalemate()) {
        onGameOver?.({ result: 'stalemate' })
      } else {
        onGameOver?.({ result: 'draw' })
      }
    }
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

  reset: () => set({ history: [], currentMoveIndex: -1, chessEngine: new Chess() }),

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
