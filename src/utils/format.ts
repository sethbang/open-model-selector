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
 */
export function formatPrice(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === '') return "—"
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num)) return "—"
    if (num < 0) return "—"
    if (num === 0) return "Free"
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
 *   - Values < 1,000 are shown as exact numbers (e.g. `500` → `"500"`).
 *   - Values ≥ 1,000 and < 1,000,000 are divided by 1,000 and rounded to the nearest
 *     integer (e.g. `8192` → `"8k"`, `1000` → `"1k"`).
 *
 * @example
 * ```ts
 * formatContextLength(128000)    // "128k"
 * formatContextLength(1_000_000) // "1M"
 * formatContextLength(1_500_000) // "1.5M"
 * ```
 *
 */
export function formatContextLength(tokens: number): string {
    if (!tokens || tokens <= 0 || isNaN(tokens)) return 'N/A'
    if (tokens < 1000) return `${Math.round(tokens)}`
    if (tokens >= 1_000_000) {
        const millions = tokens / 1_000_000
        return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`
    }
    const k = Math.round(tokens / 1000)
    return `${k}k`
}

/**
 * Format a flat USD price (per-generation, per-inpaint, per-upscale).
 * Unlike formatPrice which handles per-token values, this formats absolute USD amounts.
 * Examples: 0.04 → "$0.04", 0.18 → "$0.18", 0 → "$0.00"
 */
export function formatFlatPrice(usd: number | undefined | null): string {
    if (usd === undefined || usd === null || Number.isNaN(usd)) return '—'
    return `$${usd.toFixed(2)}`
}

/**
 * Format a per-audio-second price.
 * Examples: 0.01 → "$0.01 / sec", 0.006 → "$0.006 / sec"
 */
export function formatAudioPrice(perSecondUsd: number | undefined | null): string {
    if (perSecondUsd === undefined || perSecondUsd === null || Number.isNaN(perSecondUsd)) return '—'
    // Use enough decimal places to show meaningful values
    const formatted = perSecondUsd >= 0.01
        ? perSecondUsd.toFixed(2)
        : perSecondUsd.toFixed(4)
    return `$${formatted} / sec`
}

/**
 * Format an array of duration strings into a range.
 * Examples: ["5", "10", "30"] → "5s – 30s", ["10"] → "10s", [] → "—"
 * Handles both numeric strings and strings that may already have units.
 */
export function formatDuration(durations: string[] | undefined | null): string {
    if (!durations || durations.length === 0) return '—'
    // Parse numeric values; filter out non-numeric entries
    const nums = durations
        .map(d => parseFloat(d))
        .filter(n => !Number.isNaN(n))
        .sort((a, b) => a - b)
    if (nums.length === 0) return '—'
    if (nums.length === 1) return `${nums[0]}s`
    return `${nums[0]}s – ${nums[nums.length - 1]}s`
}

/**
 * Format an array of resolution strings into a comma-separated list.
 * Examples: ["720p", "1080p", "4K"] → "720p, 1080p, 4K", [] → "—"
 */
export function formatResolutions(resolutions: string[] | undefined | null): string {
    if (!resolutions || resolutions.length === 0) return '—'
    return resolutions.join(', ')
}

/**
 * Format an array of aspect ratio strings into a comma-separated list.
 * Examples: ["16:9", "9:16", "1:1"] → "16:9, 9:16, 1:1", [] → "—"
 */
export function formatAspectRatios(ratios: string[] | undefined | null): string {
    if (!ratios || ratios.length === 0) return '—'
    return ratios.join(', ')
}
