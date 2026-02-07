/**
 * Formats a per-token price into a human-readable per-million-tokens string.
 *
 * Accepts the price as a per-token value (matching the OpenAI / OpenRouter
 * convention) and multiplies by 1,000,000 to display the per-million rate.
 *
 * @param value - Price per token as a number or numeric string.
 *   Accepts `undefined`, `null`, empty string, or `NaN` — all return `"—"`.
 * @returns A formatted dollar string (e.g. `"$30.00"`).
 *   - Returns `"—"` for missing, empty, or non-numeric input.
 *   - Uses 2 decimal places when the per-million value is ≥ $0.01.
 *   - Uses 6 decimal places when the per-million value is < $0.01
 *     (to preserve precision for very cheap models).
 *
 * @example
 * ```ts
 * formatPrice(0.00003)    // "$30.00"   (per-token → per-million)
 * formatPrice("0.000015") // "$15.00"
 * formatPrice(1e-12)      // "$0.000001"
 * formatPrice(undefined)  // "—"
 * ```
 *
 * @internal Not part of the public package API — may change without notice.
 */
export function formatPrice(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === '') return "—"
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num)) return "—"
    if (num < 0) return "$0.00"
    const perMillion = num * 1000000
    if (perMillion < 0.01) return "$" + perMillion.toFixed(6)
    return "$" + perMillion.toFixed(2)
}

/**
 * Formats a token count into a compact human-readable string.
 *
 * @param tokens - Raw token count (e.g. `128000`, `1_000_000`).
 * @returns A compact string like `"128k"` or `"1M"`.
 *   - Values ≥ 1,000,000 are shown in millions (e.g. `"1M"`, `"1.5M"`).
 *   - Values < 1,000,000 are divided by 1,000 and rounded to the nearest
 *     integer (e.g. `8192` → `"8k"`, `500` → `"1k"`).
 *
 * @example
 * ```ts
 * formatContextLength(128000)    // "128k"
 * formatContextLength(1_000_000) // "1M"
 * formatContextLength(1_500_000) // "1.5M"
 * ```
 *
 * @internal Not part of the public package API — may change without notice.
 */
export function formatContextLength(tokens: number): string {
    if (!tokens || tokens <= 0 || isNaN(tokens)) return 'N/A'
    if (tokens >= 1_000_000) {
        const millions = tokens / 1_000_000
        return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`
    }
    const k = Math.round(tokens / 1000)
    if (k === 0) return '<1k'
    return `${k}k`
}
