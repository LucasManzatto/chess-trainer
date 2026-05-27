import { describe, it, expect } from 'vitest'
import { drillReducer } from '../components/DrillTab/useDrillPage'
import type { DrillState } from '../components/DrillTab/useDrillPage'
import type { DrillQueueItem } from '../types'

function item(moves: string[] = ['e4', 'e5', 'Nf3']): DrillQueueItem {
  return {
    opening_id: 1,
    eco: 'C00',
    name: 'Test Opening',
    pgn: '',
    fen: '',
    moves,
    ease_factor: 2.5,
    interval_days: 1,
    due_date: '2026-05-26',
    repetitions: 0,
  }
}

const QUEUE: DrillState = { phase: 'queue' }

describe('drillReducer — start', () => {
  it('queue → drilling with moveIndex 0 and flash null', () => {
    const next = drillReducer(QUEUE, { type: 'start', item: item() })
    expect(next.phase).toBe('drilling')
    if (next.phase === 'drilling') {
      expect(next.moveIndex).toBe(0)
      expect(next.flash).toBeNull()
    }
  })
})

describe('drillReducer — correct_move', () => {
  const drilling: DrillState = { phase: 'drilling', item: item(), moveIndex: 0, flash: null }

  it('increments moveIndex', () => {
    const next = drillReducer(drilling, { type: 'correct_move', nextIndex: 1 })
    expect(next.phase).toBe('drilling')
    if (next.phase === 'drilling') expect(next.moveIndex).toBe(1)
  })

  it('no-op when not drilling', () => {
    expect(drillReducer(QUEUE, { type: 'correct_move', nextIndex: 1 })).toBe(QUEUE)
  })
})

describe('drillReducer — complete', () => {
  const drilling: DrillState = { phase: 'drilling', item: item(), moveIndex: 2, flash: null }

  it('transitions to grading', () => {
    const next = drillReducer(drilling, { type: 'complete', item: item() })
    expect(next.phase).toBe('grading')
  })
})

describe('drillReducer — wrong_move', () => {
  const drilling: DrillState = { phase: 'drilling', item: item(), moveIndex: 1, flash: null }

  it('sets flash to wrong', () => {
    const next = drillReducer(drilling, { type: 'wrong_move' })
    if (next.phase === 'drilling') expect(next.flash).toBe('wrong')
  })

  it('no-op when not drilling', () => {
    expect(drillReducer(QUEUE, { type: 'wrong_move' })).toBe(QUEUE)
  })
})

describe('drillReducer — reset_flash', () => {
  const drilling: DrillState = { phase: 'drilling', item: item(), moveIndex: 1, flash: 'wrong' }

  it('clears flash and updates moveIndex', () => {
    const next = drillReducer(drilling, { type: 'reset_flash', moveIndex: 1 })
    if (next.phase === 'drilling') {
      expect(next.flash).toBeNull()
      expect(next.moveIndex).toBe(1)
    }
  })

  it('no-op when not drilling', () => {
    expect(drillReducer(QUEUE, { type: 'reset_flash', moveIndex: 0 })).toBe(QUEUE)
  })
})

describe('drillReducer — back_to_queue', () => {
  const drilling: DrillState = { phase: 'drilling', item: item(), moveIndex: 1, flash: null }
  const grading: DrillState = { phase: 'grading', item: item() }

  it('drilling → queue', () => {
    expect(drillReducer(drilling, { type: 'back_to_queue' }).phase).toBe('queue')
  })

  it('grading → queue', () => {
    expect(drillReducer(grading, { type: 'back_to_queue' }).phase).toBe('queue')
  })
})
