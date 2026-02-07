import { describe, it, expect } from 'vitest'
import { formatPrice, formatContextLength } from './format'

describe('formatPrice', () => {
  it('returns "—" for undefined', () => {
    expect(formatPrice(undefined)).toBe('—')
  })

  it('returns "—" for null', () => {
    expect(formatPrice(null)).toBe('—')
  })

  it('returns "—" for empty string', () => {
    expect(formatPrice('')).toBe('—')
  })

  it('returns "—" for NaN string', () => {
    expect(formatPrice('not-a-number')).toBe('—')
  })

  it('returns "—" for NaN number', () => {
    expect(formatPrice(NaN)).toBe('—')
  })

  it('formats zero price', () => {
    // 0 * 1_000_000 = 0, which is < 0.01, so uses 6 decimal places
    expect(formatPrice(0)).toBe('$0.000000')
  })

  it('clamps negative price to $0.00', () => {
    expect(formatPrice(-0.00003)).toBe('$0.00')
  })

  it('clamps negative string price to $0.00', () => {
    expect(formatPrice('-0.00003')).toBe('$0.00')
  })

  it('formats a normal per-token price (number)', () => {
    // 0.00003 per token → $30.00 per 1M
    expect(formatPrice(0.00003)).toBe('$30.00')
  })

  it('formats a normal per-token price (string)', () => {
    expect(formatPrice('0.00003')).toBe('$30.00')
  })

  it('formats a very small price with extended decimals', () => {
    // 1e-12 per token → 0.000001 per 1M → < 0.01 → 6 decimal places
    expect(formatPrice(1e-12)).toBe('$0.000001')
  })

  it('formats price right at the 0.01 boundary', () => {
    // 0.00000001 per token → 0.01 per 1M → not < 0.01 → 2 decimal places
    expect(formatPrice(0.00000001)).toBe('$0.01')
  })

  it('formats price just below the 0.01 boundary', () => {
    // 9.99e-9 per token → 0.00999 per 1M → < 0.01 → 6 decimal places
    expect(formatPrice(9.99e-9)).toBe('$0.009990')
  })

  it('formats OpenRouter-style string prices', () => {
    // "0.000015" per token → $15.00 per 1M
    expect(formatPrice('0.000015')).toBe('$15.00')
  })

  it('formats Venice-normalized price', () => {
    // Venice: $6/1M → normalized to 6/1_000_000 = 0.000006 per token → $6.00/1M
    const venicePerToken = 6 / 1_000_000
    expect(formatPrice(venicePerToken)).toBe('$6.00')
  })
})

describe('formatContextLength', () => {
  it('formats thousands', () => {
    expect(formatContextLength(8192)).toBe('8k')
  })

  it('formats large thousands', () => {
    expect(formatContextLength(128000)).toBe('128k')
  })

  it('formats exactly 1 million', () => {
    expect(formatContextLength(1_000_000)).toBe('1M')
  })

  it('formats millions with decimals', () => {
    expect(formatContextLength(1_500_000)).toBe('1.5M')
  })

  it('formats exactly 2 million', () => {
    expect(formatContextLength(2_000_000)).toBe('2M')
  })

  it('returns N/A for zero', () => {
    expect(formatContextLength(0)).toBe('N/A')
  })

  it('returns N/A for negative values', () => {
    expect(formatContextLength(-1000)).toBe('N/A')
  })

  it('returns N/A for NaN', () => {
    expect(formatContextLength(NaN)).toBe('N/A')
  })

  it('formats small values that round to 1k', () => {
    expect(formatContextLength(500)).toBe('1k') // Math.round(0.5) = 1 → "1k" (rounds half up)
  })

  it('returns "<1k" for values between 1 and 499', () => {
    expect(formatContextLength(499)).toBe('<1k')
    expect(formatContextLength(1)).toBe('<1k')
    expect(formatContextLength(250)).toBe('<1k')
  })

  it('formats 4096 tokens', () => {
    expect(formatContextLength(4096)).toBe('4k')
  })

  it('formats 32000 tokens', () => {
    expect(formatContextLength(32000)).toBe('32k')
  })

  it('formats 200000 tokens', () => {
    expect(formatContextLength(200000)).toBe('200k')
  })
})
