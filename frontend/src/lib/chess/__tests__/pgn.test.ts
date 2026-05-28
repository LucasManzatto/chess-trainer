import { describe, it, expect } from 'vitest'
import { parsePgn } from '../pgn'

const VALID_PGN = `[Event "Test Game"]
[White "Alice"]
[Black "Bob"]
[Date "2024.01.01"]

1. e4 e5 2. Nf3 Nc6 *`

describe('parsePgn', () => {
  it('returns error for empty string', () => {
    const result = parsePgn('')
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toBe('PGN is empty.')
  })

  it('returns error for whitespace-only string', () => {
    const result = parsePgn('   ')
    expect(result.ok).toBe(false)
  })

  it('returns error for malformed PGN', () => {
    const result = parsePgn('not a pgn at all $$$$')
    expect(result.ok).toBe(false)
  })

  it('returns error for PGN with no moves', () => {
    const result = parsePgn('[Event "Empty"]\n\n*')
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toBe('PGN contains no moves.')
  })

  it('returns moves for valid PGN', () => {
    const result = parsePgn(VALID_PGN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
  })

  it('returns metadata for valid PGN', () => {
    const result = parsePgn(VALID_PGN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.metadata.white).toBe('Alice')
    expect(result.metadata.black).toBe('Bob')
    expect(result.metadata.event).toBe('Test Game')
    expect(result.metadata.date).toBe('2024.01.01')
  })

  it('absent headers become undefined', () => {
    const result = parsePgn('1. e4 e5 *')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.metadata.white).toBeUndefined()
    expect(result.metadata.black).toBeUndefined()
  })
})
