"use client"

import { useState, useEffect, useRef } from "react"

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

/**
 * Configuration options for the useOpenAIModels hook.
 */
export interface UseOpenAIModelsProps {
  /** Base URL for the OpenAI-compatible API (e.g., "https://api.venice.ai/api/v1") */
  baseUrl?: string
  /** API key for authentication. Warning: exposed in browser if used client-side */
  apiKey?: string
  /**
   * Custom fetch function for SSR or testing.
   *
   * @remarks
   * This function is stored in a ref internally, so you don't need to memoize it
   * with `useCallback`. Changing the fetcher function will be picked up on the
   * next fetch cycle without triggering a re-fetch.
   */
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>
  /**
   * Custom function to extract the raw model array from the API response body.
   * Use this when the API response doesn't follow the standard `{ data: [...] }` shape.
   *
   * @default defaultResponseExtractor
   *
   * @remarks
   * This function is stored in a ref internally, so you don't need to memoize it.
   *
   * @example
   * ```ts
   * // API returns { results: { items: [...] } }
   * responseExtractor={(body) => body.results.items}
   * ```
   */
  responseExtractor?: ResponseExtractor
  /**
   * Custom function to normalize each raw model object into a Model.
   * Use this when the API returns model data in a non-standard shape.
   *
   * @default defaultModelNormalizer
   *
   * @remarks
   * This function is stored in a ref internally, so you don't need to memoize it.
   * You can import and extend the `defaultModelNormalizer` for partial overrides.
   *
   * @example
   * ```ts
   * import { defaultModelNormalizer } from "open-model-selector"
   *
   * normalizer={(raw) => ({
   *   ...defaultModelNormalizer(raw),
   *   provider: raw.vendor ?? "custom",
   * })}
   * ```
   */
  normalizer?: ModelNormalizer
}

/**
 * Return type of the useOpenAIModels hook.
 */
export interface UseOpenAIModelsResult {
  /** Array of available models fetched from the API */
  models: Model[]
  /** Whether the hook is currently fetching models */
  loading: boolean
  /** Error object if the fetch failed, null otherwise */
  error: Error | null
}

/**
 * Hook to fetch available models from an OpenAI-compatible API.
 *
 * @example
 * ```tsx
 * // Basic usage with Venice.ai (no API key required for model discovery)
 * const { models, loading, error } = useOpenAIModels({
 *   baseUrl: "https://api.venice.ai/api/v1",
 * })
 *
 * // Custom normalizer for exotic APIs
 * const { models } = useOpenAIModels({
 *   baseUrl: "https://my-api.com/v1",
 *   normalizer: (raw) => ({
 *     ...defaultModelNormalizer(raw),
 *     provider: raw.vendor as string ?? "custom",
 *   })
 * })
 * ```
 *
 * @param props - Configuration options
 * @returns Object containing models array, loading state, and any error
 */
export function useOpenAIModels({
  baseUrl,
  apiKey,
  fetcher,
  responseExtractor,
  normalizer,
}: UseOpenAIModelsProps): UseOpenAIModelsResult {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Store callback props in refs to avoid infinite re-fetch loops when consumers
  // pass inline functions. Refs are updated on every render so we always
  // use the latest callbacks without triggering the effect.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const extractorRef = useRef(responseExtractor)
  extractorRef.current = responseExtractor
  const normalizerRef = useRef(normalizer)
  normalizerRef.current = normalizer

  useEffect(() => {
    let isMounted = true

    if (!baseUrl) {
      setModels([])
      return
    }

    const controller = new AbortController()

    const fetchModels = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `${baseUrl.replace(/\/+$/, "")}/models`
        const headers: HeadersInit = {}
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`
        }

        let body: unknown
        const currentFetcher = fetcherRef.current
        if (currentFetcher) {
          const res = await currentFetcher(url, { headers, signal: controller.signal })
          if (!res.ok) throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`)
          body = await res.json()
        } else {
          const res = await fetch(url, { headers, signal: controller.signal })
          if (!res.ok) throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`)
          body = await res.json()
        }

        if (body === null || typeof body !== 'object') {
          throw new Error('Unexpected API response: expected JSON object or array')
        }

        // Extract raw model list from response
        const extract = extractorRef.current ?? defaultResponseExtractor
        const rawList = extract(body as Record<string, unknown> | unknown[])
          .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')

        if (rawList.length === 0 && !extractorRef.current) {
          console.debug('[open-model-selector] No models extracted from API response. You may need a custom responseExtractor.')
        }

        // Normalize each raw model into a Model, skipping entries that fail
        const normalize = normalizerRef.current ?? defaultModelNormalizer
        const normalized: Model[] = rawList
          .map((raw) => {
            try {
              return normalize(raw)
            } catch (e) {
              console.warn('[open-model-selector] Failed to normalize model:', raw.id ?? raw, e)
              return null
            }
          })
          .filter((m): m is Model => m !== null && !!m.id)

        if (isMounted) {
          setModels(normalized)
        }
      } catch (err: unknown) {
        // Ignore abort errors - they're expected during cleanup
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchModels()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [baseUrl, apiKey])

  return { models, loading, error }
}
