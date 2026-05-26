import { cpToWinPercent } from '../../../chess'
import type { MoveAnalysis, MoveClassification } from '../../../components/ChessBoard/types'

export function computeWinPercentTimeline(initialScore: number, scores: number[]): number[] {
  return [cpToWinPercent(initialScore), ...scores.map(cpToWinPercent)]
}

export function findCriticalMoves(
  moves: MoveAnalysis[],
  initialScore: number,
  userColor: 'white' | 'black',
): number[] {
  if (moves.length === 0) return []

  const scores = moves.map(m => m.score ?? 0)
  const timeline = computeWinPercentTimeline(initialScore, scores)
  const userIsWhite = userColor === 'white'
  const critical: number[] = []

  for (let i = 0; i < moves.length; i++) {
    const isUserMove = userIsWhite ? i % 2 === 0 : i % 2 !== 0
    if (!isUserMove) continue

    const winBefore = userIsWhite ? timeline[i] : 100 - timeline[i]
    const winAfter = userIsWhite ? timeline[i + 1] : 100 - timeline[i + 1]
    const drop = winBefore - winAfter

    if (drop <= 15) continue

    const recovers = timeline.slice(i + 2).some(t => {
      const userWin = userIsWhite ? t : 100 - t
      return userWin > 45
    })

    if (!recovers) critical.push(i)
  }

  return critical
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
