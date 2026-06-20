import type { StateCreator } from 'zustand'
import type { Square } from 'chess.js'
import type { HistoryEntry, MoveResult } from '../../../../lib/chess/types'
import { buildHistoryFromMoves, getFenAtIndex, applyMoveToPosition, undoLastMove } from '../../../../lib/chess/gameUtils'
import type { ChessBoardStoreType } from '../chessBoardStore'

export function getCurrentFen(state: Pick<GameSlice, 'lastExternalFen' | 'history' | 'currentMoveIndex'>): string {
  return state.lastExternalFen ?? getFenAtIndex(state)
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export type GameSlice = {
  history: HistoryEntry[]
  currentMoveIndex: number
  lastExternalFen: string | null

  loadMoves: (moves: string[]) => void
  loadFen: (fen: string) => void
  applyMove: (from: Square, to: Square) => MoveResult | null
  navigateBack: () => void
  navigateForward: () => void
  navigateToIndex: (index: number | null) => void
  undo: () => void
}

export function getInitialGameState(): Pick<GameSlice, 'history' | 'currentMoveIndex' | 'lastExternalFen'> {
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

  applyMove: (from, to) => {
    const { history, currentMoveIndex } = get()
    const fen = getFenAtIndex({ history, currentMoveIndex })
    const result = applyMoveToPosition(fen, history, currentMoveIndex, from, to)
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

  undo: () => {
    const { history, currentMoveIndex } = get()
    const { history: nextHistory, newIndex } = undoLastMove(history, currentMoveIndex)
    set({ history: nextHistory, currentMoveIndex: newIndex })
  },
})
