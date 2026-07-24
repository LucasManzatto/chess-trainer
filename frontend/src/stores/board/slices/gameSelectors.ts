import { INITIAL_FEN } from '../../../lib/chess/history'
import type { HistoryEntry, MovePair, ActiveMove } from '../../../lib/chess/types'
import type { GameState } from './gameSlice'

export function getFenAtIndex(state: GameState): string {
  return state.history[state.currentMoveIndex]?.fen ?? INITIAL_FEN
}

export function getCurrentEntry(state: GameState): HistoryEntry | undefined {
  return state.currentMoveIndex >= 0 ? state.history[state.currentMoveIndex] : undefined
}

export function getCurrentFen(state: GameState): string {
  return getCurrentEntry(state)?.fen ?? INITIAL_FEN
}

export function getLastMove(state: GameState): string | undefined {
  return getCurrentEntry(state)?.lan
}

export function getCurrentLan(state: GameState): string | undefined {
  return getCurrentEntry(state)?.lan
}

export function getParentFen(state: GameState): string {
  return state.currentMoveIndex > 0 ? state.history[state.currentMoveIndex - 1].fen : INITIAL_FEN
}

// Cache is keyed by the `history` array reference (unique per store instance, replaced
// only by loadMoves/applyMove) so multiple ChessBoardStore instances never thrash a shared slot.
function memoizeByHistoryIndex<R>(compute: (state: GameState) => R) {
  const cache = new WeakMap<HistoryEntry[], { index: number; result: R }>()
  return (state: GameState): R => {
    const cached = cache.get(state.history)
    if (cached && cached.index === state.currentMoveIndex) return cached.result
    const result = compute(state)
    cache.set(state.history, { index: state.currentMoveIndex, result })
    return result
  }
}

export const getActiveMove = memoizeByHistoryIndex((state): ActiveMove | undefined => {
  if (state.currentMoveIndex < 0) return undefined
  return {
    moveNumber: Math.floor(state.currentMoveIndex / 2) + 1,
    color: state.currentMoveIndex % 2 === 0 ? 'white' : 'black',
  }
})

export const getSanMoves = memoizeByHistoryIndex((state): string[] =>
  state.history.slice(0, state.currentMoveIndex + 1).map(e => e.san),
)

export const getUciMoves = memoizeByHistoryIndex((state): string[] =>
  state.history.slice(0, state.currentMoveIndex + 1).map(e => e.lan),
)

export const getMoves = memoizeByHistoryIndex((state): MovePair[] => {
  const pairs: MovePair[] = []
  for (let i = 0; i < state.history.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: state.history[i].san,
      black: state.history[i + 1]?.san ?? null,
    })
  }
  return pairs
})

/** Current fen followed by every ancestor back to the start, nearest first. */
export const getAncestorFens = memoizeByHistoryIndex((state): string[] => {
  const fens: string[] = []
  for (let i = state.currentMoveIndex; i >= 0; i--) fens.push(state.history[i].fen)
  fens.push(INITIAL_FEN)
  return fens
})
