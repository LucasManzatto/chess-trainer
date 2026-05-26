import { describe, it, expect } from 'vitest'
import { moveLabel } from '../utils/notesUtils'

const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']

describe('moveLabel', () => {
  it('index 0 → white move 1', () => expect(moveLabel(moves, 0)).toBe('1. e4'))
  it('index 1 → black move 1', () => expect(moveLabel(moves, 1)).toBe('1... e5'))
  it('index 2 → white move 2', () => expect(moveLabel(moves, 2)).toBe('2. Nf3'))
  it('index 3 → black move 2', () => expect(moveLabel(moves, 3)).toBe('2... Nc6'))
  it('index 4 → white move 3', () => expect(moveLabel(moves, 4)).toBe('3. Bb5'))
})
