import { describe, it, expect } from 'vitest'
import { classifyMove, cpToWinPercent, computeAccuracy } from '../evaluation'

describe('classifyMove', () => {
  it('0 cp loss → best', () => expect(classifyMove(0)).toBe('best'))
  it('10 cp loss → excellent', () => expect(classifyMove(10)).toBe('excellent'))
  it('11 cp loss → good', () => expect(classifyMove(11)).toBe('good'))
  it('25 cp loss → good', () => expect(classifyMove(25)).toBe('good'))
  it('26 cp loss → inaccuracy', () => expect(classifyMove(26)).toBe('inaccuracy'))
  it('50 cp loss → inaccuracy', () => expect(classifyMove(50)).toBe('inaccuracy'))
  it('51 cp loss → mistake', () => expect(classifyMove(51)).toBe('mistake'))
  it('100 cp loss → mistake', () => expect(classifyMove(100)).toBe('mistake'))
  it('101 cp loss → blunder', () => expect(classifyMove(101)).toBe('blunder'))
  it('500 cp loss → blunder', () => expect(classifyMove(500)).toBe('blunder'))
})

describe('cpToWinPercent', () => {
  it('0 cp → 50%', () => expect(cpToWinPercent(0)).toBeCloseTo(50))
  it('positive cp → above 50%', () => expect(cpToWinPercent(600)).toBeGreaterThan(50))
  it('negative cp → below 50%', () => expect(cpToWinPercent(-600)).toBeLessThan(50))
  it('symmetric around 0', () => {
    expect(cpToWinPercent(300) + cpToWinPercent(-300)).toBeCloseTo(100)
  })
})

describe('computeAccuracy', () => {
  it('empty losses → 100', () => expect(computeAccuracy([])).toBe(100))
  it('zero losses → ~100', () => expect(computeAccuracy([0, 0, 0])).toBeCloseTo(100, 0))
  it('large losses → low accuracy', () => expect(computeAccuracy([50, 50, 50])).toBeLessThan(50))
  it('clamps to 0 minimum', () => expect(computeAccuracy([999, 999, 999])).toBeGreaterThanOrEqual(0))
  it('clamps to 100 maximum', () => expect(computeAccuracy([0])).toBeLessThanOrEqual(100))
})
