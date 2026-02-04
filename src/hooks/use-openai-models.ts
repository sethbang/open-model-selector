import { useState, useEffect } from "react"

export interface Model {
  id: string
  name: string
  provider: string
  created: number
  description?: string
  context_length: number
  pricing: Record<string, unknown>
  is_favorite: boolean
}

interface UseOpenAIModelsProps {
  baseUrl?: string
  apiKey?: string
  fetcher?: (url: string, init?: RequestInit) => Promise<any>
}

export function useOpenAIModels({ baseUrl, apiKey, fetcher }: UseOpenAIModelsProps) {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!baseUrl) {
        setModels([])
        return
    }

    const fetchModels = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `${baseUrl.replace(/\/+$/, "")}/models`
        const headers: HeadersInit = {}
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`
        }

        let data
        if (fetcher) {
             data = await fetcher(url, { headers })
        } else {
             const res = await fetch(url, { headers })
             if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`)
             data = await res.json()
        }
        
        // Normalize
        const rawList = data.data || []
        const normalized: Model[] = rawList.map((m: any) => {
            // Context Length: Try context_length, context_window, max_tokens, or 0 if missing
            const contextLength = m.context_length || m.context_window || m.max_tokens || 0
            
            // Pricing: Try pricing, metadata.pricing, or cost
            const pricing = m.pricing || (m.metadata && m.metadata.pricing) || m.cost || undefined

            return {
                id: m.id,
                name: m.name || m.id,
                provider: m.id.split("/")[0] || "Unknown", 
                created: m.created || Date.now(),
                description: m.description, // Undefined if missing
                context_length: contextLength,
                pricing: pricing, // Undefined if missing
                is_favorite: false 
            }
        })

        setModels(normalized)
      } catch (err: any) {
        console.error("Error fetching models:", err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [baseUrl, apiKey, fetcher])

  return { models, loading, error }
}
