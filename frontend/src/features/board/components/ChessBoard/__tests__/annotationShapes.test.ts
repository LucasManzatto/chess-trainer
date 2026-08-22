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

    const hoveredBrush = brushes[shapes[0].brush!]
    const dimmedBrush = brushes[shapes[1].brush!]
    expect(hoveredBrush.lineWidth).toBeGreaterThan(dimmedBrush.lineWidth)
    // Dimmed color's alpha channel (last 2 hex digits) is lower than the hovered one's.
    expect(hoveredBrush.color.slice(-2)).not.toBe(dimmedBrush.color.slice(-2))
  })

  it('shares one brush across shapes with identical color/opacity/lineWidth', () => {
    const other: BoardAnnotationArrow = { ...arrow, from_square: 'd2', to_square: 'd4' }
    const { shapes } = toDrawShapes([arrow, other], [], 'white', null)
    expect(shapes[0].brush).toBe(shapes[1].brush)
  })

  it('always includes the base green/red/blue/yellow brushes', () => {
    const { brushes } = toDrawShapes([], [], 'white', null)
    expect(brushes.green).toBeDefined()
    expect(brushes.red).toBeDefined()
    expect(brushes.blue).toBeDefined()
    expect(brushes.yellow).toBeDefined()
  })
})
