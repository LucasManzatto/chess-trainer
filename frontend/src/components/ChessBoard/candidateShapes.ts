import { Chess } from 'chess.js'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'

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
