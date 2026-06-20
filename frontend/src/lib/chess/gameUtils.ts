import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import type { HistoryEntry, MovePair, ActiveMove } from './types'

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function toEntry(move: ReturnType<Chess['move']>, engine: Chess): HistoryEntry {
  return { san: move.san, fen: engine.fen(), from: move.from, to: move.to }
}

export function buildHistoryFromMoves(moves: string[]): HistoryEntry[] {
  const engine = new Chess()
  return moves.map(san => {
    try {
      return toEntry(engine.move(san), engine)
    } catch {
      throw new Error(`Illegal move in sequence: "${san}"`)
    }
  })
}

export function getFenAtIndex({ history, currentMoveIndex }: { history: HistoryEntry[]; currentMoveIndex: number }): string {
  return history[currentMoveIndex]?.fen ?? INITIAL_FEN
}

export function getMoves(history: HistoryEntry[]): MovePair[] {
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

export function getActiveMove(currentMoveIndex: number): ActiveMove | undefined {
  if (currentMoveIndex < 0) return undefined
  return {
    moveNumber: Math.floor(currentMoveIndex / 2) + 1,
    color: currentMoveIndex % 2 === 0 ? 'white' : 'black',
  }
}

export function applyMoveToPosition(
  fen: string,
  history: HistoryEntry[],
  currentMoveIndex: number,
  from: Square,
  to: Square,
): { history: HistoryEntry[]; newIndex: number; entry: HistoryEntry } | null {
  const engine = new Chess(fen)
  const piece = engine.get(from)
  const isPromotion =
    piece?.type === 'p' &&
    ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))
  try {
    const move = engine.move({ from, to, promotion: isPromotion ? 'q' : undefined })
    const entry = toEntry(move, engine)
    const nextHistory = [...history.slice(0, currentMoveIndex + 1), entry]
    return { history: nextHistory, newIndex: nextHistory.length - 1, entry }
  } catch {
    return null
  }
}

export function undoLastMove(
  history: HistoryEntry[],
  currentMoveIndex: number,
): { history: HistoryEntry[]; newIndex: number } {
  if (currentMoveIndex < 0) return { history, newIndex: currentMoveIndex }
  const nextHistory = history.slice(0, currentMoveIndex)
  return { history: nextHistory, newIndex: currentMoveIndex - 1 }
}
