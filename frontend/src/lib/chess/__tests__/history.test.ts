import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { buildHistoryFromMoves } from '../history'
import { getFenAtIndex } from '../../../stores/board/slices/gameSelectors'

const STARTING_FEN = new Chess().fen()

describe('buildHistoryFromMoves', () => {
  it('returns empty array for empty input', () => {
    expect(buildHistoryFromMoves([])).toEqual([])
  })

  it('produces correct length', () => {
    const history = buildHistoryFromMoves(['e4', 'e5'])
    expect(history).toHaveLength(2)
  })

  it('records correct SAN', () => {
    const history = buildHistoryFromMoves(['e4', 'e5'])
    expect(history[0].san).toBe('e4')
    expect(history[1].san).toBe('e5')
  })

  it('records from/to squares', () => {
    const history = buildHistoryFromMoves(['e4'])
    expect(history[0].from).toBe('e2')
    expect(history[0].to).toBe('e4')
  })

  it('FEN after e4 differs from starting FEN', () => {
    const history = buildHistoryFromMoves(['e4'])
    expect(history[0].fen).not.toBe(STARTING_FEN)
  })

  it('each entry has a valid FEN', () => {
    const history = buildHistoryFromMoves(['e4', 'e5', 'Nf3'])
    for (const entry of history) {
      expect(() => new Chess(entry.fen)).not.toThrow()
    }
  })
})


describe('getFenAtIndex', () => {
  const history = buildHistoryFromMoves(['e4', 'e5'])
  const s = (currentMoveIndex: number) => ({ history, currentMoveIndex })

  it('returns starting FEN for index -1', () => {
    expect(getFenAtIndex(s(-1))).toBe(STARTING_FEN)
  })

  it('returns starting FEN for empty history', () => {
    expect(getFenAtIndex({ history: [], currentMoveIndex: -1 })).toBe(STARTING_FEN)
  })

  it('returns FEN for last index', () => {
    expect(getFenAtIndex(s(history.length - 1))).toBe(history[1].fen)
  })

  it('returns correct FEN for valid index', () => {
    expect(getFenAtIndex(s(0))).toBe(history[0].fen)
    expect(getFenAtIndex(s(1))).toBe(history[1].fen)
  })
})

