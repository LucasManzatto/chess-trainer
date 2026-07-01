import { Chess } from 'chess.js'
import type { Key, Dests } from '@lichess-org/chessground/types'
import type { GameOverResult } from './types'

export function getSideFromFen(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'w' ? 'white' : 'black'
}

export function getDests(moves: { from: string; to: string }[]): Dests {
  const map: Dests = new Map()
  for (const move of moves) {
    const list = map.get(move.from as Key) ?? []
    list.push(move.to as Key)
    map.set(move.from as Key, list)
  }
  return map
}

export function getGameOver(chess: Chess): GameOverResult | null {
  if (chess.isCheckmate()) return { result: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' }
  if (chess.isStalemate()) return { result: 'stalemate' }
  if (chess.isDraw()) return { result: 'draw' }
  return null
}
