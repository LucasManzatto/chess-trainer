import { Chess } from 'chess.js'
import type { Square, PieceSymbol, Color } from 'chess.js'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'

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

      // Pinned: removing this piece exposes own king to attack (when it wasn't before)
      const kingAlreadyAttacked = isKingAttacked(chess, piece.color, enemy)
      chess.remove(square)
      if (!kingAlreadyAttacked && isKingAttacked(chess, piece.color, enemy)) {
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

export function squareToPixel(
  square: string,
  boardSize: number,
  orientation: 'white' | 'black',
  dotSize: number,
) {
  const fileIdx = square.charCodeAt(0) - 97
  const rankIdx = parseInt(square[1]) - 1
  const sq = boardSize / 8
  const col = orientation === 'white' ? fileIdx : 7 - fileIdx
  const row = orientation === 'white' ? 7 - rankIdx : rankIdx
  return { left: col * sq + sq - dotSize - 2, top: row * sq + 2 }
}

export function computeCandidateShapes(
  candidateMoves: Map<string, number>,
  boardFen: string | undefined,
): DrawShape[] {
  if (candidateMoves.size === 0) return []
  const chess = boardFen ? new Chess(boardFen) : new Chess()
  const legal = chess.moves({ verbose: true })
  const result: DrawShape[] = []
  for (const [san] of candidateMoves.entries()) {
    const move = legal.find(m => m.san === san)
    if (move) result.push({ orig: move.from as Key, dest: move.to as Key, brush: 'green' })
  }
  return result
}
