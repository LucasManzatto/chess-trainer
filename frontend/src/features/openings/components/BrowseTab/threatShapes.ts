import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

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

      // Pinned: removing this piece exposes the king to attack
      const clone = new Chess(fen)
      clone.remove(square)
      const cloneBoard = clone.board()
      let kingSquare: Square | null = null
      outer: for (let kr = 0; kr < 8; kr++) {
        for (let kc = 0; kc < 8; kc++) {
          const p = cloneBoard[kr][kc]
          if (p?.type === 'k' && p.color === piece.color) {
            kingSquare = (String.fromCharCode(97 + kc) + String(8 - kr)) as Square
            break outer
          }
        }
      }
      if (kingSquare && clone.isAttacked(kingSquare, enemy)) {
        pinned.push(square)
      }
    }
  }

  return { hanging, pinned }
}
