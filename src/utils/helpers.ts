/**
 * Merge class names, filtering out falsy values.
 * Lightweight alternative to clsx/classnames for internal use.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

/** Check whether a deprecation date is in the past.
 *  Date-only ISO 8601 strings ("2025-01-15") are parsed as UTC midnight per the
 *  ES spec, but we normalize explicitly to avoid any cross-engine ambiguity.
 *  Returns false for invalid / unparseable date strings. */
export function isDeprecated(dateStr: string): boolean {
  // For date-only strings, append UTC time explicitly so every engine
  // agrees on the interpretation (guards against non-standard formats).
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? dateStr + 'T00:00:00Z'
    : dateStr
  const ts = new Date(normalized).getTime()
  return !Number.isNaN(ts) && ts < Date.now()
}
