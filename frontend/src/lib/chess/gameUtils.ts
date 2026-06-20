import { Chess } from 'chess.js'
import type { HistoryEntry, MovePair, ActiveMove } from './types'

export const INITIAL_FEN = new Chess().fen()

export function buildHistoryFromMoves(moves: string[]): HistoryEntry[] {
  const engine = new Chess()
  return moves.map(san => {
    try {
      const move = engine.move(san)
      return { san: move.san, fen: engine.fen(), from: move.from, to: move.to }
    } catch {
      throw new Error(`Illegal move in sequence: "${san}"`)
    }
  })
}

export function getFenAtIndex({ history, currentMoveIndex }: { history: HistoryEntry[]; currentMoveIndex: number }): string {
  if (history.length === 0 || currentMoveIndex < 0) return INITIAL_FEN
  return history[currentMoveIndex]?.fen ?? INITIAL_FEN
}

export function getMoves({ history }: { history: HistoryEntry[] }): MovePair[] {
  const pairs: MovePair[] = []
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i].san,
      black: history[i + 1]?.san ?? null,
    })
  }
  return pairs
}

export function getLastMove({ history, currentMoveIndex }: { history: HistoryEntry[]; currentMoveIndex: number }): string | undefined {
  const entry = currentMoveIndex >= 0 ? history[currentMoveIndex] : undefined
  return entry ? `${entry.from}${entry.to}` : undefined
}

export function getActiveMove({ currentMoveIndex }: { currentMoveIndex: number }): ActiveMove | undefined {
  if (currentMoveIndex < 0) return undefined
  return {
    moveNumber: Math.floor(currentMoveIndex / 2) + 1,
    color: currentMoveIndex % 2 === 0 ? 'white' : 'black',
  }
}

export function applyMoveToPosition(
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
  let move!: ReturnType<Chess['move']>
  try {
    move = engine.move({ from: orig, to: dest, promotion: isPromotion ? 'q' : undefined })
  } catch {
    return null
  }
  const entry: HistoryEntry = { san: move.san, fen: engine.fen(), from: move.from, to: move.to }
  const nextHistory = [...history.slice(0, currentIndex + 1), entry]
  return { history: nextHistory, newIndex: nextHistory.length - 1, entry }
}

export function undoLastMove(
  history: HistoryEntry[],
  currentIndex: number,
): { history: HistoryEntry[]; newIndex: number } {
  if (currentIndex < 0) return { history, newIndex: currentIndex }
  const nextHistory = history.slice(0, currentIndex)
  return { history: nextHistory, newIndex: currentIndex - 1 }
}
