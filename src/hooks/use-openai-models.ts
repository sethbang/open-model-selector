"use client"

import { useState, useEffect } from "react"

/**
 * Raw model data as returned from the OpenAI-compatible API.
 */
interface RawModel {
  id: string
  name?: string
  created?: number
  description?: string
  context_length?: number
  context_window?: number
  max_tokens?: number
  pricing?: Record<string, unknown>
  cost?: Record<string, unknown>
  metadata?: {
    pricing?: Record<string, unknown>
  }
  [key: string]: unknown
}

/**
 * Response structure from the OpenAI models endpoint.
 */
interface OpenAIModelsResponse {
  data: RawModel[]
}

/**
 * Represents a model available from the API.
 */
export interface Model {
  /** Unique model identifier (e.g., "gpt-4" or "openai/gpt-4") */
  id: string
  /** Display name for the model */
  name: string
  /** Provider extracted from model ID (e.g., "openai") */
  provider: string
  /** Unix timestamp when the model was created */
  created: number
  /** Optional description of the model's capabilities */
  description?: string
  /** Maximum context window size in tokens */
  context_length: number
  /** Pricing information for the model */
  pricing: Record<string, unknown>
  /** Whether the user has marked this model as a favorite */
  is_favorite: boolean
}

/**
 * Configuration options for the useOpenAIModels hook.
 */
export interface UseOpenAIModelsProps {
  /** Base URL for the OpenAI-compatible API (e.g., "https://api.openai.com/v1") */
  baseUrl?: string
  /** API key for authentication. Warning: exposed in browser if used client-side */
  apiKey?: string
  /** Custom fetch function for SSR or testing */
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>
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
 * const { models, loading, error } = useOpenAIModels({
 *   baseUrl: "https://api.openai.com/v1",
 *   apiKey: process.env.OPENAI_API_KEY
 * })
 * ```
 *
 * @param props - Configuration options
 * @returns Object containing models array, loading state, and any error
 */
export function useOpenAIModels({ baseUrl, apiKey, fetcher }: UseOpenAIModelsProps): UseOpenAIModelsResult {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

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

        let data: OpenAIModelsResponse
        if (fetcher) {
          const res = await fetcher(url, { headers, signal: controller.signal })
          if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`)
          data = await res.json()
        } else {
          const res = await fetch(url, { headers, signal: controller.signal })
          if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`)
          data = await res.json()
        }

        // Normalize
        const rawList = data.data || []
        const normalized: Model[] = rawList.map((m: RawModel) => {
          // Context Length: Try context_length, context_window, max_tokens, or 0 if missing
          const contextLength = m.context_length || m.context_window || m.max_tokens || 0

          // Pricing: Try pricing, metadata.pricing, or cost
          const pricing = m.pricing || (m.metadata && m.metadata.pricing) || m.cost || {}

          return {
            id: m.id,
            name: m.name || m.id,
            provider: m.id.includes("/") ? m.id.split("/")[0] : "Unknown",
            created: m.created || Math.floor(Date.now() / 1000),
            description: m.description,
            context_length: contextLength,
            pricing: pricing,
            is_favorite: false,
          }
        })

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
  }, [baseUrl, apiKey, fetcher])

  return { models, loading, error }
}
