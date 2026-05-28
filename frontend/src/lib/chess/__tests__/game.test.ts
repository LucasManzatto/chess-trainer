import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { buildHistoryFromMoves, applyMoveToPosition, getFenAtIndex, undoLastMove } from '../game'

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

describe('applyMoveToPosition', () => {
  it('returns null for illegal move', () => {
    const history = buildHistoryFromMoves([])
    const result = applyMoveToPosition(STARTING_FEN, history, -1, 'e2', 'e5')
    expect(result).toBeNull()
  })

  it('returns entry for legal move', () => {
    const history = buildHistoryFromMoves([])
    const result = applyMoveToPosition(STARTING_FEN, history, -1, 'e2', 'e4')
    expect(result).not.toBeNull()
    expect(result!.entry.san).toBe('e4')
    expect(result!.newIndex).toBe(0)
    expect(result!.history).toHaveLength(1)
  })

  it('discards future moves when branching from mid-history', () => {
    const history = buildHistoryFromMoves(['e4', 'e5', 'Nf3'])
    const fen = getFenAtIndex(history, 0)
    const result = applyMoveToPosition(fen, history, 0, 'd7', 'd5')
    expect(result).not.toBeNull()
    // history should only have: e4, d5 — not Nf3
    expect(result!.history).toHaveLength(2)
    expect(result!.history[1].san).toBe('d5')
  })

  it('handles pawn promotion', () => {
    // Position with pawn about to promote
    const promotionFen = '8/P7/8/8/8/8/8/4K1k1 w - - 0 1'
    const history = buildHistoryFromMoves([])
    const result = applyMoveToPosition(promotionFen, history, -1, 'a7', 'a8')
    expect(result).not.toBeNull()
    expect(result!.entry.san).toContain('=Q')
  })
})

describe('getFenAtIndex', () => {
  const history = buildHistoryFromMoves(['e4', 'e5'])

  it('returns starting FEN for index -1', () => {
    expect(getFenAtIndex(history, -1)).toBe(STARTING_FEN)
  })

  it('returns starting FEN for empty history', () => {
    expect(getFenAtIndex([], -1)).toBe(STARTING_FEN)
  })

  it('returns last FEN for null', () => {
    expect(getFenAtIndex(history, null)).toBe(history[1].fen)
  })

  it('returns correct FEN for valid index', () => {
    expect(getFenAtIndex(history, 0)).toBe(history[0].fen)
    expect(getFenAtIndex(history, 1)).toBe(history[1].fen)
  })
})

describe('undoLastMove', () => {
  it('no-op on empty history', () => {
    const result = undoLastMove([], -1)
    expect(result.history).toEqual([])
    expect(result.newIndex).toBe(-1)
  })

  it('removes last move and decrements index', () => {
    const history = buildHistoryFromMoves(['e4', 'e5'])
    const result = undoLastMove(history, 1)
    expect(result.history).toHaveLength(1)
    expect(result.history[0].san).toBe('e4')
    expect(result.newIndex).toBe(0)
  })

  it('returns to empty state after undoing single move', () => {
    const history = buildHistoryFromMoves(['e4'])
    const result = undoLastMove(history, 0)
    expect(result.history).toHaveLength(0)
    expect(result.newIndex).toBe(-1)
  })
})
