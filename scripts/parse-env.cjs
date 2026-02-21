/**
 * parse-env.cjs
 *
 * Shared .env content parser used by both:
 *   - .storybook/main.ts   (ESM/TypeScript — uses createRequire)
 *   - scripts/capture-provider-snapshots.cjs  (CommonJS — uses require)
 *
 * Accepts raw file content (string), returns a plain { key: value } object.
 * Does NOT read files or touch process.env — callers handle both.
 *
 * Handles:
 *   - Comment lines (# ...)
 *   - Empty / whitespace-only lines
 *   - KEY=VALUE parsing (first `=` wins)
 *   - Stripping surrounding single or double quotes from values
 *   - Skipping entries with empty values after quote stripping
 */

'use strict'

/**
 * @param {string} content  Raw .env file content
 * @returns {Record<string, string>}  Parsed key-value pairs
 */
function parseEnvContent(content) {
  const vars = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    // Strip inline comments (unquoted only)
    const commentIdx = val.indexOf(' #')
    if (commentIdx !== -1 && !val.startsWith('"') && !val.startsWith("'")) {
      val = val.slice(0, commentIdx).trimEnd()
    }
    // Strip surrounding quotes (single or double)
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (val) vars[key] = val
  }
  return vars
}

module.exports = parseEnvContent
