import { INITIAL_FEN } from '../../lib/chess/history'
import type { Annotation, HistoryEntry, MovePair, ActiveMove } from '../../lib/chess/types'
import type { GameState } from './gameSlice'

export function getFenAtIndex(state: GameState): string {
  return state.history[state.currentMoveIndex]?.fen ?? INITIAL_FEN
}

export function getCurrentEntry(state: GameState): HistoryEntry | undefined {
  return state.currentMoveIndex >= 0 ? state.history[state.currentMoveIndex] : undefined
}

export function getCurrentFen(state: GameState): string {
  return state.lastExternalFen ?? getCurrentEntry(state)?.fen ?? INITIAL_FEN
}

export function getCurrentAnnotations(state: GameState): Annotation | undefined {
  return getCurrentEntry(state)?.annotations
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

export function getActiveMove(state: GameState): ActiveMove | undefined {
  if (state.currentMoveIndex < 0) return undefined
  return {
    moveNumber: Math.floor(state.currentMoveIndex / 2) + 1,
    color: state.currentMoveIndex % 2 === 0 ? 'white' : 'black',
  }
}

export function getSanMoves(state: GameState): string[] {
  return state.history.slice(0, state.currentMoveIndex + 1).map(e => e.san)
}

export function getMoves(state: GameState): MovePair[] {
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
