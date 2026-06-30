import { Chess } from 'chess.js'
import type { HistoryEntry } from './types'

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function buildHistoryFromMoves(moves: string[]): HistoryEntry[] {
  const engine = new Chess()
  return moves.map(san => {
    try {
      const move = engine.move(san)
      return { san: move.san, lan: move.lan, from: move.from, to: move.to, fen: move.after, promotion: move.promotion }
    } catch {
      throw new Error(`Illegal move in sequence: "${san}"`)
    }
  })
}
