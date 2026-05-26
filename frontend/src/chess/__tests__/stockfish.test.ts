import { describe, it, expect } from 'vitest'
import { parseScore, toWhitePerspective } from '../stockfish'

const WHITE_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
const BLACK_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

describe('parseScore', () => {
  it('parses cp score', () => {
    expect(parseScore('info depth 18 seldepth 24 score cp -45 nodes 1234')).toEqual({ type: 'cp', value: -45 })
  })
  it('parses positive cp score', () => {
    expect(parseScore('info depth 18 score cp 120')).toEqual({ type: 'cp', value: 120 })
  })
  it('parses mate score', () => {
    expect(parseScore('info depth 18 score mate 3')).toEqual({ type: 'mate', value: 3 })
  })
  it('parses negative mate score', () => {
    expect(parseScore('info depth 18 score mate -2')).toEqual({ type: 'mate', value: -2 })
  })
  it('returns null for no score', () => {
    expect(parseScore('info depth 18 nodes 1000 nps 500000')).toBeNull()
  })
  it('returns null for unrelated line', () => {
    expect(parseScore('bestmove e2e4')).toBeNull()
  })
})

describe('toWhitePerspective', () => {
  it('white to move → score unchanged', () => {
    const score = { type: 'cp' as const, value: 50 }
    // Starting FEN has white to move
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(toWhitePerspective(score, startFen)).toEqual({ type: 'cp', value: 50 })
  })
  it('black to move → score negated', () => {
    const score = { type: 'cp' as const, value: 50 }
    expect(toWhitePerspective(score, BLACK_FEN)).toEqual({ type: 'cp', value: -50 })
  })
  it('mate score also negated for black to move', () => {
    const score = { type: 'mate' as const, value: 3 }
    expect(toWhitePerspective(score, BLACK_FEN)).toEqual({ type: 'mate', value: -3 })
  })
  it('preserves type field', () => {
    const score = { type: 'mate' as const, value: 5 }
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(toWhitePerspective(score, startFen).type).toBe('mate')
  })
})

// Note: createStockfishWorker and evalFen are not unit-tested here —
// they depend on a real Worker and WASM binary. Covered by manual smoke tests.
