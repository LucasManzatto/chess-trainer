import { Chess } from 'chess.js'
import type { HistoryEntry } from './types'

const INITIAL_FEN = new Chess().fen()

export function buildHistoryFromMoves(moves: string[]): HistoryEntry[] {
  const engine = new Chess()
  return moves.map(san => {
    const move = engine.move(san)
    return { san: move.san, fen: engine.fen(), from: move.from, to: move.to }
  })
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

export function getFenAtIndex(history: HistoryEntry[], index: number | null): string {
  if (history.length === 0 || index === -1) return INITIAL_FEN
  const target = index === null ? history.length - 1 : index
  return history[target]?.fen ?? INITIAL_FEN
}

export function undoLastMove(
  history: HistoryEntry[],
  currentIndex: number,
): { history: HistoryEntry[]; newIndex: number } {
  if (currentIndex < 0) return { history, newIndex: currentIndex }
  const nextHistory = history.slice(0, currentIndex)
  return { history: nextHistory, newIndex: currentIndex - 1 }
}
