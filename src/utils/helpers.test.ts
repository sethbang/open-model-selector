import { describe, it, expect, vi, afterEach } from 'vitest'
import { cn, isDeprecated } from './helpers'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out falsy values', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b')
  })

  it('returns empty string when all values are falsy', () => {
    expect(cn(undefined, null, false)).toBe('')
  })
})

describe('isDeprecated', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when date-only string is in the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    expect(isDeprecated('2025-01-15')).toBe(true)
  })

  it('returns false when date-only string is in the future', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    expect(isDeprecated('2025-12-01')).toBe(false)
  })

  it('returns true when full ISO datetime is in the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    expect(isDeprecated('2025-01-15T00:00:00Z')).toBe(true)
  })

  it('returns false when full ISO datetime is in the future', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    expect(isDeprecated('2025-12-01T00:00:00Z')).toBe(false)
  })

  it('treats date-only strings consistently as UTC midnight', () => {
    vi.useFakeTimers()
    // Set current time to just after UTC midnight on Jan 15
    vi.setSystemTime(new Date('2025-01-15T00:00:01Z'))
    // "2025-01-15" should be in the past (UTC midnight < 1 second past midnight)
    expect(isDeprecated('2025-01-15')).toBe(true)
  })

  it('returns false when date-only string matches current UTC date at midnight exactly', () => {
    vi.useFakeTimers()
    // Set current time to exactly UTC midnight on Jan 15
    vi.setSystemTime(new Date('2025-01-15T00:00:00Z'))
    // "2025-01-15" parses as UTC midnight, which equals now — not strictly less, so false
    expect(isDeprecated('2025-01-15')).toBe(false)
  })

  it('returns false for invalid date strings', () => {
    expect(isDeprecated('not-a-date')).toBe(false)
    expect(isDeprecated('')).toBe(false)
  })
})
