import { cpToWinPercent } from '../../../lib/chess'
import type { MoveAnalysis, MoveClassification } from '../../../lib/chess/types'

export function computeWinPercentTimeline(initialScore: number, scores: number[]): number[] {
  return [cpToWinPercent(initialScore), ...scores.map(cpToWinPercent)]
}

export function countClassifications(
  moves: MoveAnalysis[],
  userColor: 'white' | 'black',
): { user: Record<MoveClassification, number>; opponent: Record<MoveClassification, number> } {
  const empty = (): Record<MoveClassification, number> => ({
    best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0,
  })

  const user = empty()
  const opponent = empty()
  const userIsWhite = userColor === 'white'

  moves.forEach((m, i) => {
    const isUserMove = userIsWhite ? i % 2 === 0 : i % 2 !== 0
    const target = isUserMove ? user : opponent
    target[m.classification]++
  })

  return { user, opponent }
}
