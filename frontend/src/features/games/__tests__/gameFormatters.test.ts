import { describe, it, expect } from 'vitest'
import { formatDate, timeControlLabel } from '../utils/gameFormatters'

describe('formatDate', () => {
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('includes month and year for valid ISO date', () => {
    const result = formatDate('2024-01-15T10:00:00Z')
    expect(result).toContain('2024')
    expect(result.toLowerCase()).toContain('jan')
  })
})

describe('timeControlLabel', () => {
  it('returns empty string for null', () => {
    expect(timeControlLabel(null)).toBe('')
  })

  it('returns bullet icon for 60s', () => {
    expect(timeControlLabel('60+0')).toBe('⚡')
  })

  it('returns bullet icon at 179s boundary', () => {
    expect(timeControlLabel('179+0')).toBe('⚡')
  })

  it('returns blitz icon for 300s', () => {
    expect(timeControlLabel('300+5')).toBe('⏱')
  })

  it('returns empty string for 600s rapid', () => {
    expect(timeControlLabel('600+0')).toBe('')
  })

  it('returns empty string for daily format (non-numeric)', () => {
    expect(timeControlLabel('1/259200')).toBe('')
  })
})
