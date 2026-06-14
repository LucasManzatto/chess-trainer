import { Chess } from 'chess.js'
import type { StateCreator } from 'zustand'
import type { HistoryEntry, MoveResult, MovePair, ActiveMove } from '../../../../lib/chess/types'
import type { ChessBoardStoreType } from '../chessBoardStore'

// ─── Pure chess utilities ─────────────────────────────────────────────────────

export const INITIAL_FEN = new Chess().fen()

export function buildHistoryFromMoves(moves: string[]): HistoryEntry[] {
  const engine = new Chess()
  return moves.map(san => {
    const move = engine.move(san)
    return { san: move.san, fen: engine.fen(), from: move.from, to: move.to }
  })
}

export function getFenAtIndex(state: Pick<GameSlice, 'history' | 'currentMoveIndex'>): string {
  if (state.history.length === 0 || state.currentMoveIndex < 0) return INITIAL_FEN
  return state.history[state.currentMoveIndex]?.fen ?? INITIAL_FEN
}

export function getMoves(state: Pick<GameSlice, 'history'>): MovePair[] {
  const pairs: MovePair[] = []
  for (let i = 0; i < state.history.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: state.history[i].san,
      black: state.history[i + 1]?.san ?? null,
    })
  }
  return pairs
}

export function getPlayedMoves(state: Pick<GameSlice, 'history' | 'currentMoveIndex'>): string[] {
  return state.history.slice(0, state.currentMoveIndex + 1).map(e => e.san)
}

export function getCurrentFen(state: Pick<GameSlice, 'lastExternalFen' | 'history' | 'currentMoveIndex'>): string {
  return state.lastExternalFen ?? getFenAtIndex(state)
}

export function getActiveMove(state: Pick<GameSlice, 'currentMoveIndex'>): ActiveMove | undefined {
  if (state.currentMoveIndex < 0) return undefined
  return {
    moveNumber: Math.floor(state.currentMoveIndex / 2) + 1,
    color: state.currentMoveIndex % 2 === 0 ? 'white' : 'black',
  }
}

// ─── Slice-private helpers ────────────────────────────────────────────────────

function applyMoveToPosition(
  currentFen: string,
  history: HistoryEntry[],
  currentIndex: number,
  orig: string,
  dest: string,
): { history: HistoryEntry[]; newIndex: number; entry: HistoryEntry } | null {
  const engine = new Chess(currentFen)
  const piece = engine.get(orig as Parameters<Chess['get']>[0])
  const isPromotion =
    piece?.type === 'p' &&
    ((piece.color === 'w' && dest[1] === '8') || (piece.color === 'b' && dest[1] === '1'))
  let move: ReturnType<Chess['move']>
  try {
    move = engine.move({ from: orig, to: dest, promotion: isPromotion ? 'q' : undefined })
  } catch {
    return null
  }

  const entry: HistoryEntry = { san: move.san, fen: engine.fen(), from: move.from, to: move.to }
  const nextHistory = [...history.slice(0, currentIndex + 1), entry]
  return { history: nextHistory, newIndex: nextHistory.length - 1, entry }
}

function undoLastMove(
  history: HistoryEntry[],
  currentIndex: number,
): { history: HistoryEntry[]; newIndex: number } {
  if (currentIndex < 0) return { history, newIndex: currentIndex }
  const nextHistory = history.slice(0, currentIndex)
  return { history: nextHistory, newIndex: currentIndex - 1 }
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export type GameSlice = {
  history: HistoryEntry[]
  currentMoveIndex: number
  lastExternalFen: string | null

  loadMoves: (moves: string[]) => void
  loadFen: (fen: string) => void
  applyMove: (orig: string, dest: string) => MoveResult | null
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

  applyMove: (orig, dest) => {
    const { history, currentMoveIndex } = get()
    const currentFen = getFenAtIndex({ history, currentMoveIndex })
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

  undo: () => {
    const { history, currentMoveIndex } = get()
    const { history: nextHistory, newIndex } = undoLastMove(history, currentMoveIndex)
    set({ history: nextHistory, currentMoveIndex: newIndex })
  },
})
