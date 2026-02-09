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

  it('returns "Free" for zero price (number)', () => {
    expect(formatPrice(0)).toBe('Free')
  })

  it('returns "Free" for zero price (string)', () => {
    expect(formatPrice('0')).toBe('Free')
  })

  it('returns "—" for negative price', () => {
    expect(formatPrice(-0.00003)).toBe('—')
  })

  it('returns "—" for negative string price', () => {
    expect(formatPrice('-0.00003')).toBe('—')
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

  it('returns exact number for values under 1000', () => {
    expect(formatContextLength(500)).toBe('500')
    expect(formatContextLength(999)).toBe('999')
    expect(formatContextLength(1)).toBe('1')
    expect(formatContextLength(250)).toBe('250')
    expect(formatContextLength(499)).toBe('499')
  })

  it('formats 1000 as 1k', () => {
    expect(formatContextLength(1000)).toBe('1k')
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

// ═══════════════════════════════════════════════════════════════════════════
// New format functions — Phase 10A
// ═══════════════════════════════════════════════════════════════════════════

import { formatFlatPrice, formatAudioPrice, formatDuration, formatResolutions, formatAspectRatios } from './format'

describe('formatFlatPrice', () => {
  it('returns "—" for undefined', () => {
    expect(formatFlatPrice(undefined)).toBe('—')
  })

  it('returns "—" for null', () => {
    expect(formatFlatPrice(null)).toBe('—')
  })

  it('returns "—" for NaN', () => {
    expect(formatFlatPrice(NaN)).toBe('—')
  })

  it('formats zero', () => {
    expect(formatFlatPrice(0)).toBe('$0.00')
  })

  it('formats small price', () => {
    expect(formatFlatPrice(0.04)).toBe('$0.04')
  })

  it('formats medium price', () => {
    expect(formatFlatPrice(0.18)).toBe('$0.18')
  })

  it('formats price with rounding', () => {
    expect(formatFlatPrice(1.5)).toBe('$1.50')
  })
})

describe('formatAudioPrice', () => {
  it('returns "—" for undefined', () => {
    expect(formatAudioPrice(undefined)).toBe('—')
  })

  it('returns "—" for null', () => {
    expect(formatAudioPrice(null)).toBe('—')
  })

  it('returns "—" for NaN', () => {
    expect(formatAudioPrice(NaN)).toBe('—')
  })

  it('formats normal per-second price', () => {
    expect(formatAudioPrice(0.01)).toBe('$0.01 / sec')
  })

  it('formats small per-second price with 4 decimals', () => {
    expect(formatAudioPrice(0.006)).toBe('$0.0060 / sec')
  })
})

describe('formatDuration', () => {
  it('returns "—" for undefined', () => {
    expect(formatDuration(undefined)).toBe('—')
  })

  it('returns "—" for null', () => {
    expect(formatDuration(null)).toBe('—')
  })

  it('returns "—" for empty array', () => {
    expect(formatDuration([])).toBe('—')
  })

  it('formats single duration', () => {
    expect(formatDuration(['5'])).toBe('5s')
  })

  it('formats range', () => {
    expect(formatDuration(['5', '10', '30'])).toBe('5s – 30s')
  })

  it('sorts values', () => {
    expect(formatDuration(['10', '5'])).toBe('5s – 10s')
  })

  it('returns "—" for non-numeric', () => {
    expect(formatDuration(['abc'])).toBe('—')
  })
})

describe('formatResolutions', () => {
  it('returns "—" for undefined', () => {
    expect(formatResolutions(undefined)).toBe('—')
  })

  it('returns "—" for null', () => {
    expect(formatResolutions(null)).toBe('—')
  })

  it('returns "—" for empty array', () => {
    expect(formatResolutions([])).toBe('—')
  })

  it('formats multiple resolutions', () => {
    expect(formatResolutions(['720p', '1080p', '4K'])).toBe('720p, 1080p, 4K')
  })

  it('formats single resolution', () => {
    expect(formatResolutions(['1080p'])).toBe('1080p')
  })
})

describe('formatAspectRatios', () => {
  it('returns "—" for undefined', () => {
    expect(formatAspectRatios(undefined)).toBe('—')
  })

  it('returns "—" for null', () => {
    expect(formatAspectRatios(null)).toBe('—')
  })

  it('returns "—" for empty array', () => {
    expect(formatAspectRatios([])).toBe('—')
  })

  it('formats multiple ratios', () => {
    expect(formatAspectRatios(['16:9', '9:16', '1:1'])).toBe('16:9, 9:16, 1:1')
  })

  it('formats single ratio', () => {
    expect(formatAspectRatios(['1:1'])).toBe('1:1')
  })
})
