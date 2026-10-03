import { describe, expect, it } from 'vitest'
import { fromDisplayWeight, toDisplayWeight, weightStep } from './units'

describe('toDisplayWeight', () => {
  it('rounds kg to the nearest 0.5', () => {
    expect(toDisplayWeight(61.23, 'kg')).toBe(61)
    expect(toDisplayWeight(61.3, 'kg')).toBe(61.5)
  })

  it('converts kg to lb rounded to the nearest 1', () => {
    expect(toDisplayWeight(100, 'lb')).toBe(220)
    expect(toDisplayWeight(20, 'lb')).toBe(44)
  })
})

describe('fromDisplayWeight', () => {
  it('stores kg as entered', () => {
    expect(fromDisplayWeight(82.5, 'kg')).toBe(82.5)
  })

  it('converts lb to kg with 2 decimals', () => {
    expect(fromDisplayWeight(135, 'lb')).toBe(61.23)
  })

  it('round-trips lb values a user typed', () => {
    for (const lb of [5, 45, 135, 225, 315]) {
      expect(toDisplayWeight(fromDisplayWeight(lb, 'lb'), 'lb')).toBe(lb)
    }
  })
})

describe('weightStep', () => {
  it('is 2.5 kg or 5 lb', () => {
    expect(weightStep('kg')).toBe(2.5)
    expect(weightStep('lb')).toBe(5)
  })
})
