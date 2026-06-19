import type { Position } from '../../openings/types'

export type OpeningMatch = { opening: Position; moveCount: number }

export function computeOpeningMatch(
  gameMoves: string[],
  openings: Position[],
): OpeningMatch | null {
  let best: OpeningMatch | null = null
  for (const opening of openings) {
    const n = opening.moves.length
    if (best && n <= best.moveCount) continue
    if (opening.moves.every((m, i) => gameMoves[i] === m)) best = { opening, moveCount: n }
  }
  return best
}

export function computeOpeningMoveCount(
  gameMoves: string[],
  openings: Position[],
): number {
  return computeOpeningMatch(gameMoves, openings)?.moveCount ?? 0
}
