import { describe, it, expect } from 'vitest'
import { parseNamePath, buildNameTree } from '../components/OpeningsList/useNameTree'
import type { Opening } from '../types'

function opening(id: number, name: string): Opening {
  return { id, eco: 'A00', name, pgn: '', fen: '', moves: [] }
}

describe('parseNamePath', () => {
  it('no colon → single segment', () => {
    expect(parseNamePath('Sicilian Defense')).toEqual(['Sicilian Defense'])
  })

  it('colon with no comma → two segments', () => {
    expect(parseNamePath('Sicilian Defense: Open Variation')).toEqual([
      'Sicilian Defense',
      'Open Variation',
    ])
  })

  it('colon and comma → three segments', () => {
    expect(parseNamePath("King's Indian Defense: Orthodox Variation, Classical System")).toEqual([
      "King's Indian Defense",
      'Orthodox Variation',
      'Classical System',
    ])
  })

  it('comma in third segment stays in third segment', () => {
    const result = parseNamePath('A: B, C, D')
    expect(result).toHaveLength(3)
    expect(result[2]).toBe('C, D')
  })
})

describe('buildNameTree', () => {
  it('empty input → empty array', () => {
    expect(buildNameTree([])).toEqual([])
  })

  it('single opening → one root node', () => {
    const roots = buildNameTree([opening(1, 'Sicilian Defense')])
    expect(roots).toHaveLength(1)
    expect(roots[0].label).toBe('Sicilian Defense')
    expect(roots[0].opening?.id).toBe(1)
  })

  it('two openings sharing parent → shared root, two children', () => {
    const roots = buildNameTree([
      opening(1, 'Sicilian Defense: Open Variation'),
      opening(2, 'Sicilian Defense: Closed Variation'),
    ])
    expect(roots).toHaveLength(1)
    expect(roots[0].label).toBe('Sicilian Defense')
    expect(roots[0].opening).toBeNull()
    expect(roots[0].children).toHaveLength(2)
  })

  it('intermediate node has opening: null', () => {
    const roots = buildNameTree([opening(1, 'A: B')])
    expect(roots[0].opening).toBeNull()
    expect(roots[0].children[0].opening?.id).toBe(1)
  })

  it('two different openings → two root nodes', () => {
    const roots = buildNameTree([
      opening(1, 'Sicilian Defense'),
      opening(2, "King's Indian Defense"),
    ])
    expect(roots).toHaveLength(2)
  })

  it('three-segment name → correct nesting depth', () => {
    const roots = buildNameTree([
      opening(1, "King's Indian Defense: Orthodox Variation, Classical System"),
    ])
    expect(roots[0].children[0].children[0].opening?.id).toBe(1)
  })
})
