import { describe, it, expect } from 'vitest'
import { computeWinPercentTimeline, findCriticalMoves, countClassifications } from '../utils/analysisUtils'
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

describe('findCriticalMoves', () => {
  it('returns [] for empty moves', () => {
    expect(findCriticalMoves([], 0, 'white')).toEqual([])
  })

  it('returns [] when user win% never drops significantly', () => {
    // All scores near 0 — no big swings
    const moves = [move(10), move(-10), move(15), move(-15)]
    expect(findCriticalMoves(moves, 0, 'white')).toEqual([])
  })

  it('returns [] when drop occurs but user recovers above 45%', () => {
    // White (user) drops on move 0, but recovers
    // initialScore=0 (~50%), after move 0 score=-400 (~25%), after move 1 score=200 (~62% for white)
    const moves = [move(-400, 'blunder'), move(200)]
    expect(findCriticalMoves(moves, 0, 'white')).toEqual([])
  })

  it('identifies critical move when drop > 15pp and never recovers', () => {
    // initialScore=0 (~50%), white move at index 0 drops to -500 (~20%), never recovers
    const moves = [move(-500, 'blunder'), move(-450), move(-480)]
    const result = findCriticalMoves(moves, 0, 'white')
    expect(result).toContain(0)
  })

  it('only flags user moves, not opponent moves', () => {
    // Black (user) plays on odd indices; index 0 is white (opponent) move
    // Opponent blunders on index 0 (which is actually a white/opponent move for black user)
    const moves = [move(-500, 'blunder'), move(-480)]
    // user is black, so user moves are odd indices (index 1)
    // index 0 is opponent (white) move — should not be critical for black user
    const result = findCriticalMoves(moves, 0, 'black')
    expect(result).not.toContain(0)
  })

  it('returns multiple critical moves when multiple qualify', () => {
    // Two separate blunders where position never recovers
    const moves = [
      move(-300, 'blunder'), // white (user) move at index 0
      move(-280),             // black move (opponent)
      move(-600, 'blunder'), // white (user) move at index 2
      move(-580),
    ]
    const result = findCriticalMoves(moves, 0, 'white')
    expect(result).toContain(0)
    expect(result).toContain(2)
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
