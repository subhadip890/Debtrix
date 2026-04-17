import { describe, it, expect } from 'vitest'
import { calcShare } from '../utils/helpers'

describe('calcShare — split amount calculation', () => {
  it('splits 100 XLM equally among 4 people → 25 XLM each', () => {
    expect(calcShare(100, 4)).toBe(25)
  })

  it('splits 75 XLM among 3 people → 25 XLM each', () => {
    expect(calcShare(75, 3)).toBe(25)
  })

  it('returns 0 when N < 2 (invalid split)', () => {
    expect(calcShare(100, 1)).toBe(0)
    expect(calcShare(100, 0)).toBe(0)
  })

  it('returns 0 when total is 0 or negative', () => {
    expect(calcShare(0, 4)).toBe(0)
    expect(calcShare(-50, 4)).toBe(0)
  })

  it('handles decimal XLM amounts correctly', () => {
    const share = calcShare(10.5, 3)
    expect(share).toBeCloseTo(3.5, 5)
  })

  it('handles uneven splits (floating point result)', () => {
    const share = calcShare(10, 3)
    expect(share).toBeCloseTo(3.333333, 5)
  })
})
