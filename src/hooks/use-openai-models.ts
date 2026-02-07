"use client"

import { useState, useEffect, useRef } from "react"
import {
  defaultModelNormalizer,
  defaultResponseExtractor,
} from '../utils/normalizers'
import type {
  Model,
  ModelPricing,
  ModelNormalizer,
  ResponseExtractor,
} from '../utils/normalizers'

// Re-export types and functions so existing consumers of this module are unaffected
export { defaultModelNormalizer, defaultResponseExtractor }
export type { Model, ModelPricing, ModelNormalizer, ResponseExtractor }

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
      setError(null)
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
          setModels([])
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
