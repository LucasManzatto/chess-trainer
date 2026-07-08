import { describe, it, expect } from 'vitest'
import { computeWinPercentTimeline, countClassifications } from '../utils/analysisUtils'
import { cpToWinPercent } from '../../../lib/chess'
import type { MoveAnalysis } from '../../../lib/chess/types'

function move(score: number, classification: MoveAnalysis['classification'] = 'good'): MoveAnalysis {
  return { san: 'e4', cp_loss: 0, best_move: 'e4', classification, score }
}

describe('computeWinPercentTimeline', () => {
  it('length equals scores.length + 1', () => {
    const scores = [10, 20, 30]
    expect(computeWinPercentTimeline(0, scores)).toHaveLength(4)
  })

  it('first element is cpToWinPercent(initialScore)', () => {
    const timeline = computeWinPercentTimeline(200, [100])
    expect(timeline[0]).toBeCloseTo(cpToWinPercent(200))
  })

  it('subsequent elements correspond to scores', () => {
    const timeline = computeWinPercentTimeline(0, [100, -100])
    expect(timeline[1]).toBeCloseTo(cpToWinPercent(100))
    expect(timeline[2]).toBeCloseTo(cpToWinPercent(-100))
  })
})

describe('countClassifications', () => {
  it('assigns white user even-indexed moves', () => {
    const moves: MoveAnalysis[] = [
      move(0, 'best'),       // index 0 — white (user)
      move(0, 'blunder'),    // index 1 — black (opponent)
      move(0, 'mistake'),    // index 2 — white (user)
    ]
    const { user, opponent } = countClassifications(moves, 'white')
    expect(user.best).toBe(1)
    expect(user.mistake).toBe(1)
    expect(opponent.blunder).toBe(1)
    expect(user.blunder).toBe(0)
  })

  it('assigns black user odd-indexed moves', () => {
    const moves: MoveAnalysis[] = [
      move(0, 'best'),       // index 0 — white (opponent)
      move(0, 'blunder'),    // index 1 — black (user)
    ]
    const { user, opponent } = countClassifications(moves, 'black')
    expect(user.blunder).toBe(1)
    expect(opponent.best).toBe(1)
  })

  it('returns zero counts for all classifications when moves is empty', () => {
    const { user, opponent } = countClassifications([], 'white')
    expect(user.blunder).toBe(0)
    expect(opponent.blunder).toBe(0)
  })
})
