"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import type { ModelType, AnyModel } from '../types'
import {
  defaultModelNormalizer,
  defaultResponseExtractor,
  type ModelNormalizer,
  type ResponseExtractor,
} from '../utils/normalizers/index'

/** A fetch-compatible function signature. Used for SSR, testing, or proxy scenarios. */
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

export interface UseModelsProps {
  baseUrl?: string
  apiKey?: string
  /** Filter results to a specific model type. If omitted, returns all types. */
  type?: ModelType
  /**
   * Query parameters to append to the /models endpoint URL.
   *
   * Venice.ai requires `{ type: 'all' }` to return non-text models.
   * Other providers typically need no query params.
   *
   * @default {}
   */
  queryParams?: Record<string, string>
  fetcher?: FetchFn
  responseExtractor?: ResponseExtractor
  normalizer?: ModelNormalizer
}

export interface UseModelsResult {
  models: AnyModel[]
  loading: boolean
  error: Error | null
}

/**
 * Fetches and normalizes AI models from an OpenAI-compatible `/models` endpoint.
 * Handles loading state, errors, abort/timeout, and optional client-side type filtering.
 *
 * @example
 * ```ts
 * const { models, loading, error } = useModels({ baseUrl: "/api/v1", type: "text" })
 * ```
 */
export function useModels(props: UseModelsProps): UseModelsResult {
  const { baseUrl, apiKey, type, queryParams } = props

  const [allModels, setAllModels] = useState<AnyModel[]>([])
  const [loading, setLoading] = useState<boolean>(!!baseUrl)
  const [error, setError] = useState<Error | null>(null)

  // Store callbacks and object params in refs to avoid re-triggering the effect
  const fetcherRef = useRef(props.fetcher)
  fetcherRef.current = props.fetcher

  const extractorRef = useRef(props.responseExtractor)
  extractorRef.current = props.responseExtractor

  const normalizerRef = useRef(props.normalizer)
  normalizerRef.current = props.normalizer

  const queryParamsRef = useRef(queryParams)
  queryParamsRef.current = queryParams

  // Serialized key for stable change detection (avoids infinite loop from inline objects)
  const queryParamsKey = JSON.stringify(queryParams)

  useEffect(() => {
    if (!baseUrl) {
      setAllModels([])
      setLoading(false)
      setError(null)
      return
    }

    // Validate URL scheme — only allow http(s) to prevent data: / javascript: / file: injection
    if (!/^https?:\/\//i.test(baseUrl)) {
      setAllModels([])
      setLoading(false)
      setError(new Error(`Invalid baseUrl scheme: URL must start with http:// or https://`))
      return
    }

    const controller = new AbortController()
    let isMounted = true

    async function fetchModels() {
      setLoading(true)
      setError(null)

      // Create a combined abort signal with 10s timeout.
      // Use AbortSignal.any when available; otherwise fall back to a manual setTimeout.
      let manualTimeoutId: ReturnType<typeof setTimeout> | undefined
      let signal: AbortSignal

      try {
        // Build URL with query params
        const cleanBase = baseUrl!.replace(/\/+$/, '')
        const params = queryParamsRef.current ?? {}
        const qs = new URLSearchParams(params).toString()
        const url = `${cleanBase}/models${qs ? `?${qs}` : ''}`

        const headers: Record<string, string> = {}
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        }

        const fetchFn = fetcherRef.current ?? fetch

        if (typeof AbortSignal.any === 'function') {
          const timeoutSignal = AbortSignal.timeout(10000)
          signal = AbortSignal.any([controller.signal, timeoutSignal])
        } else {
          // Fallback: manually abort the controller after 10s
          manualTimeoutId = setTimeout(() => controller.abort(), 10000)
          signal = controller.signal
        }

        const response = await fetchFn(url, {
          headers,
          signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to load models (HTTP ${response.status})`)
        }

        const json: unknown = await response.json()

        if (!json || (typeof json !== 'object' && !Array.isArray(json))) {
          throw new Error('Invalid response: expected JSON object or array')
        }

        const extractor = extractorRef.current ?? defaultResponseExtractor
        const rawModels = extractor(json as Record<string, unknown> | unknown[])
          .filter((item): item is Record<string, unknown> =>
            item !== null && typeof item === 'object' && !Array.isArray(item)
          )

        const normalizer = normalizerRef.current ?? defaultModelNormalizer
        const normalized: AnyModel[] = []
        for (const raw of rawModels) {
          try {
            const model = normalizer(raw)
            if (model && model.id) {
              normalized.push(model)
            }
          } catch (error) {
            // Skip models that fail normalization
            if (process.env.NODE_ENV !== 'production') {
              const modelId = raw.id ?? raw.model_id ?? 'unknown'
              console.warn(
                `[open-model-selector] Failed to normalize model "${modelId}":`,
                error
              )
            }
          }
        }

        if (isMounted) {
          setAllModels(normalized)
          setError(null)
        }
      } catch (err) {
        if (isMounted && !controller.signal.aborted) {
          setAllModels([])
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (manualTimeoutId !== undefined) clearTimeout(manualTimeoutId)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- queryParamsKey is a serialized stable proxy for queryParams
  }, [baseUrl, apiKey, queryParamsKey])

  // Client-side filter by type if specified
  const models = useMemo(() => {
    if (!type) return allModels
    return allModels.filter(m => m.type === type)
  }, [allModels, type])

  return { models, loading, error }
}

export type { FetchFn }
