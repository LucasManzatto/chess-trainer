import { describe, it, expect } from 'vitest'
import { computeOpeningMoveCount } from '../utils/gameLogic'
import type { Opening } from '../../openings/types'

function opening(eco: string, moves: string[]): Opening {
  return { id: 1, name: 'Test', eco, moves, pgn: '', fen: '' }
}

describe('computeOpeningMoveCount', () => {
  it('returns 0 for null eco', () => {
    expect(computeOpeningMoveCount([], null, [opening('B20', ['e4', 'c5'])])).toBe(0)
  })

  it('returns 0 for empty openings list', () => {
    expect(computeOpeningMoveCount(['e4', 'c5'], 'B20', [])).toBe(0)
  })

  it('returns 0 for ECO mismatch', () => {
    expect(computeOpeningMoveCount(['e4', 'c5'], 'A00', [opening('B20', ['e4', 'c5'])])).toBe(0)
  })

  it('returns move count when all moves match', () => {
    const op = opening('B20', ['e4', 'c5', 'Nf3'])
    expect(computeOpeningMoveCount(['e4', 'c5', 'Nf3', 'd4'], 'B20', [op])).toBe(3)
  })

  it('returns 0 when moves diverge', () => {
    const op = opening('B20', ['e4', 'c5', 'Nf3'])
    expect(computeOpeningMoveCount(['e4', 'c5', 'd4'], 'B20', [op])).toBe(0)
  })

  it('returns longest match when multiple openings share ECO', () => {
    const short = opening('B20', ['e4', 'c5'])
    const long = opening('B20', ['e4', 'c5', 'Nf3'])
    expect(computeOpeningMoveCount(['e4', 'c5', 'Nf3', 'd6'], 'B20', [short, long])).toBe(3)
  })
})
