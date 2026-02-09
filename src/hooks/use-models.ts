"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import type { ModelType, AnyModel } from '../types'
import {
  defaultModelNormalizer,
  defaultResponseExtractor,
  type ModelNormalizer,
  type ResponseExtractor,
} from '../utils/normalizers/index'

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
   * @default { type: 'all' }
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

    const controller = new AbortController()
    let isMounted = true

    async function fetchModels() {
      setLoading(true)
      setError(null)

      try {
        // Build URL with query params (default: ?type=all for Venice compatibility)
        const cleanBase = baseUrl!.replace(/\/+$/, '')
        const params = queryParamsRef.current ?? { type: 'all' }
        const qs = new URLSearchParams(params).toString()
        const url = `${cleanBase}/models${qs ? `?${qs}` : ''}`

        const headers: Record<string, string> = {}
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        }

        const fetchFn = fetcherRef.current ?? fetch
        const response = await fetchFn(url, {
          headers,
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
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

// Re-export types for convenience
export type { FetchFn }
export {
  defaultModelNormalizer,
  defaultResponseExtractor,
} from '../utils/normalizers/index'
export type {
  ModelNormalizer,
  ResponseExtractor,
} from '../utils/normalizers/index'
