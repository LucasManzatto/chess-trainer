import { describe, it, expect } from 'vitest'
import { buildTrie, walkTrie, collectOpenings } from '../hooks/useOpeningTrie'
import type { Opening } from '../types'

function opening(id: number, moves: string[]): Opening {
  return { id, eco: 'A00', name: `Opening ${id}`, pgn: '', fen: '', moves }
}

describe('buildTrie', () => {
  it('empty input → root with no children', () => {
    const root = buildTrie([])
    expect(root.children.size).toBe(0)
    expect(root.count).toBe(0)
    expect(root.openings).toEqual([])
  })

  it('single opening → correct child chain', () => {
    const o = opening(1, ['e4', 'e5'])
    const root = buildTrie([o])
    expect(root.count).toBe(1)
    const e4 = root.children.get('e4')
    expect(e4).toBeDefined()
    expect(e4!.count).toBe(1)
    const e5 = e4!.children.get('e5')
    expect(e5).toBeDefined()
    expect(e5!.openings).toContain(o)
  })

  it('two openings sharing prefix → shared node count 2, branching at divergence', () => {
    const o1 = opening(1, ['e4', 'e5', 'Nf3'])
    const o2 = opening(2, ['e4', 'e5', 'Nc3'])
    const root = buildTrie([o1, o2])
    const e5 = root.children.get('e4')!.children.get('e5')!
    expect(e5.count).toBe(2)
    expect(e5.children.size).toBe(2)
    expect(e5.children.has('Nf3')).toBe(true)
    expect(e5.children.has('Nc3')).toBe(true)
  })

  it('opening placed at correct leaf node', () => {
    const o = opening(1, ['d4'])
    const root = buildTrie([o])
    expect(root.children.get('d4')!.openings).toContain(o)
    expect(root.openings).toHaveLength(0)
  })
})

describe('walkTrie', () => {
  const root = buildTrie([opening(1, ['e4', 'e5']), opening(2, ['d4', 'd5'])])

  it('empty path → root', () => {
    expect(walkTrie(root, [])).toBe(root)
  })

  it('valid path → correct node', () => {
    const node = walkTrie(root, ['e4', 'e5'])
    expect(node).not.toBeNull()
    expect(node!.openings[0].id).toBe(1)
  })

  it('missing move → null', () => {
    expect(walkTrie(root, ['e4', 'e6'])).toBeNull()
  })

  it('missing root move → null', () => {
    expect(walkTrie(root, ['c4'])).toBeNull()
  })
})

describe('collectOpenings', () => {
  it('leaf node → returns its opening', () => {
    const o = opening(1, ['e4'])
    const root = buildTrie([o])
    const leaf = walkTrie(root, ['e4'])!
    expect(collectOpenings(leaf)).toContain(o)
  })

  it('branch node → returns all descendant openings', () => {
    const o1 = opening(1, ['e4', 'e5'])
    const o2 = opening(2, ['e4', 'c5'])
    const root = buildTrie([o1, o2])
    const e4 = walkTrie(root, ['e4'])!
    const all = collectOpenings(e4)
    expect(all).toHaveLength(2)
    expect(all.map(o => o.id).sort()).toEqual([1, 2])
  })

  it('root → returns all openings', () => {
    const openings = [opening(1, ['e4']), opening(2, ['d4']), opening(3, ['c4'])]
    const root = buildTrie(openings)
    expect(collectOpenings(root)).toHaveLength(3)
  })
})
