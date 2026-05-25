import { Chess } from 'chess.js'
import type { Square, PieceSymbol, Color } from 'chess.js'

export type ThreatSquares = { hanging: Square[]; pinned: Square[] }

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

      // Hanging: attacked by enemy AND not defended by any friendly piece
      if (chess.isAttacked(square, enemy) && !chess.isAttacked(square, piece.color)) {
        hanging.push(square)
      }

      // Pinned: removing this piece exposes own king to attack
      // Reuse single Chess instance with remove/put to avoid N constructor calls
      chess.remove(square)
      if (isKingAttacked(chess, piece.color, enemy)) {
        pinned.push(square)
      }
      chess.put({ type: piece.type as PieceSymbol, color: piece.color as Color }, square)
    }
  }

  return { hanging, pinned }
}

function isKingAttacked(chess: Chess, kingColor: string, attackerColor: string): boolean {
  const board = chess.board()
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (p?.type === 'k' && p.color === kingColor) {
        const kingSquare = (String.fromCharCode(97 + c) + String(8 - r)) as Square
        return chess.isAttacked(kingSquare, attackerColor as Color)
      }
    }
  }
  return false
}
