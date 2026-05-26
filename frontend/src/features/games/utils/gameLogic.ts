import type { Opening } from '../../openings/types'

export function computeOpeningMoveCount(
  gameMoves: string[],
  gameEco: string | null,
  openings: Opening[],
): number {
  if (!gameEco) return 0
  let best = 0
  for (const opening of openings) {
    if (opening.eco !== gameEco) continue
    const n = opening.moves.length
    if (n <= best) continue
    if (opening.moves.every((m, i) => gameMoves[i] === m)) best = n
  }
  return best
}
