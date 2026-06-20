import type { HistoryEntry } from './types'

export function getSanMoves(history: HistoryEntry[], currentMoveIndex: number): string[] {
  return history.slice(0, currentMoveIndex + 1).map(e => e.san)
}
