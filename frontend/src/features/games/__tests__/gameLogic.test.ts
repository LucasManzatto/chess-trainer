import { describe, it, expect } from 'vitest'
import { computeOpeningMoveCount } from '../utils/gameLogic'
import type { Position } from '../../openings/types'

function opening(moves: string[]): Position {
  return {
    id: '1',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    name: 'Test',
    moves,
    created_at: '',
  }
}

describe('computeOpeningMoveCount', () => {
  it('returns 0 for empty openings list', () => {
    expect(computeOpeningMoveCount(['e4', 'c5'], [])).toBe(0)
  })

  it('returns move count when all moves match', () => {
    const op = opening(['e4', 'c5', 'Nf3'])
    expect(computeOpeningMoveCount(['e4', 'c5', 'Nf3', 'd4'], [op])).toBe(3)
  })

  it('returns 0 when moves diverge', () => {
    const op = opening(['e4', 'c5', 'Nf3'])
    expect(computeOpeningMoveCount(['e4', 'c5', 'd4'], [op])).toBe(0)
  })

  it('returns longest match across multiple openings', () => {
    const short = opening(['e4', 'c5'])
    const long = opening(['e4', 'c5', 'Nf3'])
    expect(computeOpeningMoveCount(['e4', 'c5', 'Nf3', 'd6'], [short, long])).toBe(3)
  })
})
