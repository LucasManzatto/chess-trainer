import { Chess } from 'chess.js'
import type { StateCreator } from 'zustand'
import type { Square } from 'chess.js'
import type { Annotation, HistoryEntry, MoveResult } from '../../lib/chess/types'
import { buildHistoryFromMoves, INITIAL_FEN } from '../../lib/chess/history'
import { getGameOver } from '../../lib/chess/position'
import type { ChessBoardStoreType } from '../chessBoardStore'
import { getCurrentEntry } from './gameSelectors'

// ─── Slice ────────────────────────────────────────────────────────────────────

export type GameState = {
  history: HistoryEntry[]
  currentMoveIndex: number
  lastExternalFen: string | null
}

export type GameActions = {
  loadMoves: (moves: string[]) => void
  loadFen: (fen: string) => void
  applyMove: (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => MoveResult | null
  updateAnnotations: (index: number, annotations: Annotation) => void
  clearAnnotations: (index: number) => void
  navigateBack: () => void
  navigateForward: () => void
  navigateToIndex: (index: number | null) => void
  undo: () => void
}

export type GameSlice = GameState & GameActions

export function getInitialGameState(): GameState {
  return {
    history: [],
    currentMoveIndex: -1,
    lastExternalFen: null,
  }
}

export const createGameSlice: StateCreator<ChessBoardStoreType, [], [], GameSlice> = (set, get) => ({
  ...getInitialGameState(),

  loadMoves: (moves) => {
    const history = buildHistoryFromMoves(moves)
    set({ history, currentMoveIndex: history.length - 1, lastExternalFen: null })
  },

  loadFen: (fen) => {
    set({ history: [], currentMoveIndex: -1, lastExternalFen: fen })
  },

  applyMove: (from, to, promotion) => {
    const { history, currentMoveIndex, lastExternalFen } = get()
    const fen = getCurrentEntry({ history, currentMoveIndex, lastExternalFen })?.fen ?? INITIAL_FEN
    const engine = new Chess(fen)
    const piece = engine.get(from)
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))
    try {
      const move = engine.move({ from, to, promotion: isPromotion ? (promotion ?? 'q') : undefined })
      const entry: HistoryEntry = { san: move.san, lan: move.lan, from: move.from, to: move.to, fen: move.after, promotion: move.promotion }
      const nextHistory = [...history.slice(0, currentMoveIndex + 1), entry]
      const newIndex = nextHistory.length - 1
      set({ history: nextHistory, currentMoveIndex: newIndex, lastExternalFen: null })
      return { from: entry.from, to: entry.to, san: entry.san, fen: entry.fen, gameOver: getGameOver(engine) }
    } catch {
      return null
    }
  },

  updateAnnotations: (index, annotations) => set(s => {
    const next = [...s.history]
    next[index] = { ...next[index], annotations }
    return { history: next }
  }),

  clearAnnotations: (index) => set(s => {
    const next = [...s.history]
    const { annotations: _, ...rest } = next[index]
    next[index] = rest
    return { history: next }
  }),

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

  undo: () => {
    const { history, currentMoveIndex } = get()
    if (currentMoveIndex < 0) return
    set({ history: history.slice(0, currentMoveIndex), currentMoveIndex: currentMoveIndex - 1 })
  },
})
