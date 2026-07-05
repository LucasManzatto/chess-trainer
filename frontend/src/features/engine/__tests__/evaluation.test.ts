import { describe, it, expect } from 'vitest'
import { cpToWinPercent } from '../evaluation'

describe('cpToWinPercent', () => {
  it('0 cp → 50%', () => expect(cpToWinPercent(0)).toBeCloseTo(50))
  it('positive cp → above 50%', () => expect(cpToWinPercent(600)).toBeGreaterThan(50))
  it('negative cp → below 50%', () => expect(cpToWinPercent(-600)).toBeLessThan(50))
  it('symmetric around 0', () => {
    expect(cpToWinPercent(300) + cpToWinPercent(-300)).toBeCloseTo(100)
  })
})
