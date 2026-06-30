import { Chess } from 'chess.js'
import type { Square, PieceSymbol, Color } from 'chess.js'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'
import type { ThreatSquares } from './types'

export function computeThreats(fen: string): ThreatSquares {
  const chess = new Chess(fen)
  const board = chess.board()
  const hanging: Square[] = []
  const pinned: Square[] = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.type === 'k') continue

      const square = (String.fromCharCode(97 + c) + String(8 - r)) as Square
      const enemy = piece.color === 'w' ? 'b' : 'w'

      if (chess.isAttacked(square, enemy) && !chess.isAttacked(square, piece.color)) {
        hanging.push(square)
      }

      const kingSquare = findKingSquare(board, piece.color)
      const kingAlreadyAttacked = kingSquare ? chess.isAttacked(kingSquare, enemy as Color) : false
      chess.remove(square)
      const boardAfter = chess.board()
      const kingSquareAfter = findKingSquare(boardAfter, piece.color)
      if (!kingAlreadyAttacked && kingSquareAfter && chess.isAttacked(kingSquareAfter, enemy as Color)) {
        pinned.push(square)
      }
      chess.put({ type: piece.type as PieceSymbol, color: piece.color as Color }, square)
    }
  }

  return { hanging, pinned }
}

function findKingSquare(board: ReturnType<Chess['board']>, kingColor: string): Square | undefined {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (p?.type === 'k' && p.color === kingColor) {
        return (String.fromCharCode(97 + c) + String(8 - r)) as Square
      }
    }
  }
  return undefined
}

export function computeCandidateShapes(
  moves: Map<string, number>,
  fen: string | undefined,
): DrawShape[] {
  if (moves.size === 0) return []
  const chess = fen ? new Chess(fen) : new Chess()
  const legal = chess.moves({ verbose: true })
  const result: DrawShape[] = []
  for (const [san] of moves.entries()) {
    const move = legal.find(m => m.san === san)
    if (move) result.push({ orig: move.from as Key, dest: move.to as Key, brush: 'green' })
  }
  return result
}
