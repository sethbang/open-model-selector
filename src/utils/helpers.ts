/**
 * Merge class names, filtering out falsy values.
 * Lightweight alternative to clsx/classnames for internal use.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

/** Check whether a deprecation date is in the past */
export function isDeprecated(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}
