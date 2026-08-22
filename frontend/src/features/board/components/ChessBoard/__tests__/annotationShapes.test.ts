import { describe, it, expect } from 'vitest'
import { pointToSquare, toDrawShapes } from '../annotationShapes'
import type { BoardAnnotationArrow } from '../../../types'

describe('pointToSquare', () => {
  const boardSize = 800 // 100px per cell

  it('maps top-left corner to a8 when white-oriented', () => {
    expect(pointToSquare(10, 10, boardSize, 'white')).toBe('a8')
  })

  it('maps bottom-left corner to a1 when white-oriented', () => {
    expect(pointToSquare(10, 790, boardSize, 'white')).toBe('a1')
  })

  it('flips both axes when black-oriented', () => {
    expect(pointToSquare(10, 10, boardSize, 'black')).toBe('h1')
    expect(pointToSquare(10, 790, boardSize, 'black')).toBe('h8')
  })

  it('returns null outside the board', () => {
    expect(pointToSquare(-1, 10, boardSize, 'white')).toBeNull()
    expect(pointToSquare(boardSize, 10, boardSize, 'white')).toBeNull()
  })
})

describe('toDrawShapes', () => {
  const arrow: BoardAnnotationArrow = {
    from_square: 'e2',
    to_square: 'e4',
    color: 'G',
    category: null,
    comment: null,
    line_style: 'solid',
    order: null,
    line_id: null,
  }

  it('gives the hovered shape full opacity and dims the rest', () => {
    const other: BoardAnnotationArrow = { ...arrow, from_square: 'd2', to_square: 'd4' }
    const { shapes, brushes } = toDrawShapes([arrow, other], [], 'white', 'e2-e4')

    // lineWidth rides chessground's native per-shape `modifiers`, not the brush.
    expect(shapes[0].modifiers?.lineWidth).toBeGreaterThan(shapes[1].modifiers?.lineWidth ?? 0)
    // Dimmed color's alpha channel (last 2 hex digits) is lower than the hovered one's.
    const hoveredBrush = brushes[shapes[0].brush!]
    const dimmedBrush = brushes[shapes[1].brush!]
    expect(hoveredBrush.color.slice(-2)).not.toBe(dimmedBrush.color.slice(-2))
  })

  it('shares one brush across shapes with identical color/opacity', () => {
    const other: BoardAnnotationArrow = { ...arrow, from_square: 'd2', to_square: 'd4' }
    const { shapes } = toDrawShapes([arrow, other], [], 'white', null)
    expect(shapes[0].brush).toBe(shapes[1].brush)
  })

  it('shares one brush across two dimmed shapes of the same color despite the hovered arrow being elsewhere', () => {
    // Both b2-b4 and c2-c4 are dimmed (neither is e2-e4, the hovered key) and share color/opacity
    // — lineWidth riding shape.modifiers rather than the brush key means they still share one
    // brush entry, same as when nothing is hovered at all.
    const dimmedA: BoardAnnotationArrow = { ...arrow, from_square: 'b2', to_square: 'b4' }
    const dimmedB: BoardAnnotationArrow = { ...arrow, from_square: 'c2', to_square: 'c4' }
    const { shapes } = toDrawShapes([dimmedA, dimmedB], [], 'white', 'e2-e4')
    expect(shapes[0].brush).toBe(shapes[1].brush)
  })

  it('always includes the base green/red/blue/yellow brushes', () => {
    const { brushes } = toDrawShapes([], [], 'white', null)
    expect(brushes.green).toBeDefined()
    expect(brushes.red).toBeDefined()
    expect(brushes.blue).toBeDefined()
    expect(brushes.yellow).toBeDefined()
  })

  it('sets modifiers.hilite only on the hovered arrow', () => {
    const other: BoardAnnotationArrow = { ...arrow, from_square: 'd2', to_square: 'd4' }
    const { shapes } = toDrawShapes([arrow, other], [], 'white', 'e2-e4')
    expect(shapes[0].modifiers?.hilite).toBeDefined()
    expect(shapes[1].modifiers?.hilite).toBeUndefined()
  })

  it('uses a native label for an ordered, uncategorized arrow at full opacity', () => {
    const ordered: BoardAnnotationArrow = { ...arrow, order: 2 }
    const { shapes } = toDrawShapes([ordered], [], 'white', null)
    expect(shapes[0].label).toEqual({ text: '2', fill: expect.any(String) })
  })

  it('falls back to a hand-drawn (dimmable) badge for an ordered arrow while dimmed', () => {
    const ordered: BoardAnnotationArrow = { ...arrow, order: 2 }
    const other: BoardAnnotationArrow = { ...arrow, from_square: 'd2', to_square: 'd4' }
    // `other` is hovered, so `ordered` is dimmed and must not get chessground's native label
    // (which never applies opacity) — it needs its own dimmable customSvg badge instead.
    const { shapes } = toDrawShapes([ordered, other], [], 'white', 'd2-d4')
    expect(shapes[0].label).toBeUndefined()
    expect(shapes[0].customSvg?.html).toContain('>2<')
  })
})
