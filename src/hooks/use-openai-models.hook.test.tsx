import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOpenAIModels } from './use-openai-models'

// --- Test Fixtures ---

const mockApiModels = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    owned_by: 'openai',
    created: 1700000000,
    context_length: 8192,
    pricing: { prompt: 0.00003, completion: 0.00006 },
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    owned_by: 'anthropic',
    created: 1710000000,
    context_length: 200000,
    pricing: { prompt: 0.000015, completion: 0.000075 },
  },
]

// --- Helpers ---

function createFetchMock(data: unknown[], delay = 0) {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay))
    if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
}

function createFailingFetchMock(status = 500, statusText = 'Internal Server Error') {
  return vi.fn(async () => {
    return new Response('', { status, statusText })
  })
}

// --- Tests ---

describe('useOpenAIModels', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty models and no loading when baseUrl is not provided', () => {
    const { result } = renderHook(() => useOpenAIModels({}))

    expect(result.current.models).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches and normalizes models from the API', async () => {
    const fetcher = createFetchMock(mockApiModels)

    const { result } = renderHook(() =>
      useOpenAIModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      })
    )

    // Initially loading
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.models).toHaveLength(2)
    expect(result.current.models[0].id).toBe('gpt-4')
    expect(result.current.models[0].name).toBe('GPT-4')
    expect(result.current.models[0].provider).toBe('openai')
    expect(result.current.models[1].id).toBe('claude-3-opus')
    expect(result.current.error).toBeNull()
  })

  it('constructs the correct URL from baseUrl', async () => {
    const fetcher = createFetchMock([])

    renderHook(() =>
      useOpenAIModels({
        baseUrl: 'https://api.example.com/v1/',
        fetcher,
      })
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.example.com/v1/models',
        expect.any(Object)
      )
    })
  })

  it('strips trailing slashes from baseUrl', async () => {
    const fetcher = createFetchMock([])

    renderHook(() =>
      useOpenAIModels({
        baseUrl: 'https://api.example.com/v1///',
        fetcher,
      })
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.example.com/v1/models',
        expect.any(Object)
      )
    })
  })

  it('sends Authorization header when apiKey is provided', async () => {
    const fetcher = createFetchMock([])

    renderHook(() =>
      useOpenAIModels({
        baseUrl: 'https://api.example.com/v1',
        apiKey: 'sk-test-123',
        fetcher,
      })
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer sk-test-123' },
        })
      )
    })
  })

  it('sets error state when fetch fails', async () => {
    const fetcher = createFailingFetchMock(500, 'Internal Server Error')

    const { result } = renderHook(() =>
      useOpenAIModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toContain('500')
    expect(result.current.models).toEqual([])
  })

  it('clears models when fetch fails after a previous success', async () => {
    const successFetcher = createFetchMock(mockApiModels)
    const failFetcher = createFailingFetchMock()

    const { result, rerender } = renderHook(
      ({ fetcher, baseUrl }: { fetcher: typeof successFetcher; baseUrl: string }) =>
        useOpenAIModels({ baseUrl, fetcher }),
      { initialProps: { fetcher: successFetcher, baseUrl: 'https://api.example.com/v1' } }
    )

    // Wait for successful fetch
    await waitFor(() => {
      expect(result.current.models).toHaveLength(2)
    })

    // Change to failing endpoint
    rerender({ fetcher: failFetcher, baseUrl: 'https://api.failing.com/v1' })

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error)
    })

    // Models should be cleared
    expect(result.current.models).toEqual([])
  })

  it('clears models when baseUrl is removed', async () => {
    const fetcher = createFetchMock(mockApiModels)

    const { result, rerender } = renderHook(
      ({ baseUrl }: { baseUrl?: string }) =>
        useOpenAIModels({ baseUrl, fetcher }),
      { initialProps: { baseUrl: 'https://api.example.com/v1' as string | undefined } }
    )

    await waitFor(() => {
      expect(result.current.models).toHaveLength(2)
    })

    rerender({ baseUrl: undefined })

    await waitFor(() => {
      expect(result.current.models).toEqual([])
    })
  })

  it('clears error when baseUrl is removed after a failed fetch', async () => {
    const failFetcher = createFailingFetchMock()
    const successFetcher = createFetchMock(mockApiModels)

    const { result, rerender } = renderHook(
      ({ baseUrl, fetcher }: { baseUrl?: string; fetcher: typeof failFetcher }) =>
        useOpenAIModels({ baseUrl, fetcher }),
      { initialProps: { baseUrl: 'https://api.example.com/v1' as string | undefined, fetcher: failFetcher } }
    )

    // Wait for the error state
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error)
    })

    // Remove baseUrl — error should be cleared
    rerender({ baseUrl: undefined, fetcher: successFetcher as typeof failFetcher })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
      expect(result.current.models).toEqual([])
    })
  })

  it('uses custom responseExtractor', async () => {
    const customData = [{ id: 'custom-model', name: 'Custom', owned_by: 'test', created: 1700000000 }]
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ results: { items: customData } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { result } = renderHook(() =>
      useOpenAIModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
        responseExtractor: (body) => (body as any).results.items,
      })
    )

    await waitFor(() => {
      expect(result.current.models).toHaveLength(1)
    })

    expect(result.current.models[0].id).toBe('custom-model')
  })

  it('uses custom normalizer', async () => {
    const fetcher = createFetchMock(mockApiModels)

    const { result } = renderHook(() =>
      useOpenAIModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
        normalizer: (raw) => ({
          id: String(raw.id),
          name: `Custom: ${raw.name}`,
          provider: 'custom-provider',
          created: 0,
          context_length: 0,
          pricing: {},
          is_favorite: false,
        }),
      })
    )

    await waitFor(() => {
      expect(result.current.models).toHaveLength(2)
    })

    expect(result.current.models[0].name).toBe('Custom: GPT-4')
    expect(result.current.models[0].provider).toBe('custom-provider')
  })

  it('aborts in-flight request on unmount', async () => {
    const fetcher = createFetchMock(mockApiModels, 500) // 500ms delay

    const { unmount } = renderHook(() =>
      useOpenAIModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      })
    )

    // Unmount before fetch completes
    unmount()

    // The fetcher should have been called with an AbortSignal
    expect(fetcher).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    )
  })

  it('re-fetches when baseUrl changes', async () => {
    const fetcher = createFetchMock(mockApiModels)

    const { result, rerender } = renderHook(
      ({ baseUrl }: { baseUrl: string }) =>
        useOpenAIModels({ baseUrl, fetcher }),
      { initialProps: { baseUrl: 'https://api.example.com/v1' } }
    )

    await waitFor(() => {
      expect(result.current.models).toHaveLength(2)
    })

    rerender({ baseUrl: 'https://api.other.com/v1' })

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  it('re-fetches when apiKey changes', async () => {
    const fetcher = createFetchMock(mockApiModels)

    const { rerender } = renderHook(
      ({ apiKey }: { apiKey?: string }) =>
        useOpenAIModels({ baseUrl: 'https://api.example.com/v1', apiKey, fetcher }),
      { initialProps: { apiKey: 'key-1' as string | undefined } }
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    rerender({ apiKey: 'key-2' })

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })
})
