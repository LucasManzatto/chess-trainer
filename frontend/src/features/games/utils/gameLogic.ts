import type { Opening } from '../../openings/types'

export type OpeningMatch = { opening: Opening; moveCount: number }

export function computeOpeningMatch(
  gameMoves: string[],
  gameEco: string | null,
  openings: Opening[],
): OpeningMatch | null {
  if (!gameEco) return null
  let best: OpeningMatch | null = null
  for (const opening of openings) {
    if (opening.eco !== gameEco) continue
    const n = opening.moves.length
    if (best && n <= best.moveCount) continue
    if (opening.moves.every((m, i) => gameMoves[i] === m)) best = { opening, moveCount: n }
  }
  return best
}

export function computeOpeningMoveCount(
  gameMoves: string[],
  gameEco: string | null,
  openings: Opening[],
): number {
  return computeOpeningMatch(gameMoves, gameEco, openings)?.moveCount ?? 0
}
