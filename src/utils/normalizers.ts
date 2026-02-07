/**
 * Pure utility functions for normalizing OpenAI-compatible API responses.
 * No React dependencies — safe for RSC and server-side usage.
 */

/**
 * Pricing information for a model.
 * Supports both numeric (decimal) and string representations of prices.
 */
export interface ModelPricing {
  /** Price per token for input/prompt tokens */
  prompt?: string | number
  /** Price per token for output/completion tokens */
  completion?: string | number
  /** Allow additional pricing fields for flexibility (e.g., cached tokens, fine-tuning) */
  [key: string]: unknown
}

/**
 * Represents a model available from the API.
 */
export interface Model {
  /** Unique model identifier (e.g., "gpt-4" or "zai-org-glm-4.7") */
  id: string
  /** Display name for the model */
  name: string
  /** Provider extracted from model ID or response metadata (e.g., "openai", "venice.ai") */
  provider: string
  /** Unix timestamp when the model was created */
  created: number
  /** Optional description of the model's capabilities */
  description?: string
  /** Maximum context window size in tokens */
  context_length: number
  /** Pricing information for the model */
  pricing: ModelPricing
  /** Whether the user has marked this model as a favorite */
  is_favorite: boolean
}

/**
 * Function that extracts the raw model array from an API response body.
 * Override this to handle APIs with non-standard response shapes.
 *
 * @example
 * ```ts
 * // API returns { models: [...] } instead of { data: [...] }
 * const extractor: ResponseExtractor = (body) => body.models
 * ```
 */
export type ResponseExtractor = (body: Record<string, unknown> | unknown[]) => Record<string, unknown>[]

/**
 * Function that transforms a single raw model object into a normalized Model.
 * Override this to handle APIs with non-standard model shapes.
 *
 * @example
 * ```ts
 * const normalizer: ModelNormalizer = (raw) => ({
 *   id: raw.model_id as string,
 *   name: raw.display_name as string,
 *   provider: "my-provider",
 *   created: Date.now() / 1000,
 *   context_length: raw.max_ctx as number ?? 0,
 *   pricing: {},
 *   is_favorite: false,
 * })
 * ```
 */
export type ModelNormalizer = (raw: Record<string, unknown>) => Model

/**
 * Default response extractor. Handles the standard OpenAI `{ data: [...] }` shape.
 * Falls back to checking for a top-level `models` array.
 *
 * @remarks
 * The returned array may contain non-object elements (e.g., if the API returns
 * a flat array of strings). Callers should filter for plain objects before passing
 * entries to a normalizer — see the `.filter()` in `useOpenAIModels` for an example.
 */
export function defaultResponseExtractor(body: Record<string, unknown> | unknown[]): Record<string, unknown>[] {
  if (Array.isArray(body)) return body as Record<string, unknown>[]
  if (Array.isArray(body.data)) return body.data
  if (Array.isArray(body.models)) return body.models
  return []
}

/** Safely coerce a value to a number, returning undefined for non-numeric or NaN values */
function toNum(v: unknown): number | undefined {
  if (typeof v === 'number' && !isNaN(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (!isNaN(n)) return n
  }
  return undefined
}

/**
 * Default model normalizer. Handles response shapes from:
 * - OpenAI standard (`id`, `name`, `context_length`, `pricing`)
 * - Venice.ai (`model_spec.name`, `model_spec.availableContextTokens`, `model_spec.pricing`)
 * - OpenRouter (`id` with provider prefix, `context_length`, `pricing`)
 * - Other OpenAI-compatible APIs with common field variations
 */
export function defaultModelNormalizer(m: Record<string, unknown>): Model {
  const spec = m.model_spec as Record<string, unknown> | undefined

  // Context Length: Try standard fields, then Venice's model_spec.availableContextTokens.
  // Note: max_tokens is omitted — it typically refers to max *output* tokens, not context window size.
  const contextLength =
    toNum(m.context_length) ??
    toNum(m.context_window) ??
    toNum(spec?.availableContextTokens) ??
    0

  // Pricing: Try standard fields first, then Venice's model_spec.pricing format
  const rawPricing = m.pricing as ModelPricing | undefined
  const metadataPricing = (m.metadata as Record<string, unknown> | undefined)?.pricing as ModelPricing | undefined
  const costPricing = m.cost as ModelPricing | undefined
  let pricing: ModelPricing = rawPricing ?? metadataPricing ?? costPricing ?? {}

  if (spec?.pricing && !rawPricing && !costPricing && !metadataPricing) {
    const specPricing = spec.pricing as Record<string, unknown>
    const input = specPricing.input
    const output = specPricing.output
    // Venice's model_spec.pricing returns prices per-million-tokens (e.g., { usd: 6 } = $6/1M).
    // Normalize to per-token to match the OpenAI/OpenRouter convention used by formatPrice().
    const inputUsd = typeof input === 'object' && input !== null ? (input as Record<string, unknown>).usd as number | undefined : undefined
    const outputUsd = typeof output === 'object' && output !== null ? (output as Record<string, unknown>).usd as number | undefined : undefined
    pricing = {
      prompt: inputUsd !== undefined ? inputUsd / 1_000_000 : undefined,
      completion: outputUsd !== undefined ? outputUsd / 1_000_000 : undefined,
    }
  }

  // Provider: Try slash-separated ID prefix, owned_by, or "Unknown".
  // Note: `||` is intentional for owned_by — empty string should fall through to "Unknown".
  const id = (m.id as string) || (m.model_id as string) || ""
  if (!id) {
    throw new Error('Model missing required id field')
  }
  const provider = id.includes("/")
    ? id.split("/")[0]
    : (m.owned_by as string) || "Unknown"

  return {
    id,
    name: (spec?.name as string) || (m.name as string) || id,
    provider,
    created: toNum(m.created) ?? Math.floor(Date.now() / 1000),
    description: (spec?.description as string) || (m.description as string),
    context_length: contextLength,
    pricing,
    is_favorite: false,
  }
}
