import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useModels } from './use-models'

// --- Test Fixtures ---

const mockApiResponse = {
  data: [
    {
      id: 'gpt-4',
      type: 'text',
      model_spec: {
        name: 'GPT-4',
        pricing: { input: { usd: 30 }, output: { usd: 60 } },
        availableContextTokens: 128000,
      },
    },
    {
      id: 'dall-e-3',
      type: 'image',
      model_spec: {
        name: 'DALL-E 3',
        pricing: { generation: { usd: 0.04 } },
      },
    },
    {
      id: 'wan-video',
      type: 'video',
      model_spec: {
        name: 'Wan Video',
        constraints: { durations: ['5', '10'] },
      },
    },
  ],
}

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

describe('useModels', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 1. No baseUrl
  it('returns empty models, loading=false, no error when baseUrl is not provided', () => {
    const { result } = renderHook(() => useModels({}))

    expect(result.current.models).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  // 2. Fetches and normalizes models
  it('fetches and normalizes a mix of text/image/video models', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      }),
    )

    // Initially loading
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.models).toHaveLength(3)
    expect(result.current.error).toBeNull()

    // Text model
    const textModel = result.current.models.find((m) => m.id === 'gpt-4')
    expect(textModel).toBeDefined()
    expect(textModel!.type).toBe('text')
    expect(textModel!.name).toBe('GPT-4')

    // Image model
    const imageModel = result.current.models.find((m) => m.id === 'dall-e-3')
    expect(imageModel).toBeDefined()
    expect(imageModel!.type).toBe('image')
    expect(imageModel!.name).toBe('DALL-E 3')

    // Video model
    const videoModel = result.current.models.find((m) => m.id === 'wan-video')
    expect(videoModel).toBeDefined()
    expect(videoModel!.type).toBe('video')
    expect(videoModel!.name).toBe('Wan Video')
  })

  // 3. URL construction with default queryParams
  it('appends no query string by default', async () => {
    const fetcher = createFetchMock([])

    renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.example.com/v1/models',
        expect.any(Object),
      )
    })
  })

  // 4. URL construction with custom queryParams
  it('uses custom queryParams in the URL', async () => {
    const fetcher = createFetchMock([])

    renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        queryParams: { foo: 'bar' },
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.example.com/v1/models?foo=bar',
        expect.any(Object),
      )
    })
  })

  // 5. URL construction with empty queryParams
  it('omits query string when queryParams is empty', async () => {
    const fetcher = createFetchMock([])

    renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        queryParams: {},
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.example.com/v1/models',
        expect.any(Object),
      )
    })
  })

  // 6. Authorization header
  it('sends Authorization header when apiKey is provided', async () => {
    const fetcher = createFetchMock([])

    renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        apiKey: 'sk-test-123',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer sk-test-123' },
        }),
      )
    })
  })

  // 7. Type filtering — text
  it('filters to only text models when type="text"', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        type: 'text',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.models).toHaveLength(1)
    expect(result.current.models[0].id).toBe('gpt-4')
    expect(result.current.models[0].type).toBe('text')
  })

  // 8. Type filtering — image
  it('filters to only image models when type="image"', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        type: 'image',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.models).toHaveLength(1)
    expect(result.current.models[0].id).toBe('dall-e-3')
    expect(result.current.models[0].type).toBe('image')
  })

  // 9. Error handling
  it('sets error state when fetch returns 500', async () => {
    const fetcher = createFailingFetchMock(500, 'Internal Server Error')

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toContain('500')
    expect(result.current.models).toEqual([])
  })

  // 10. Clears models on baseUrl removal
  it('clears models when baseUrl is removed', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result, rerender } = renderHook(
      ({ baseUrl }: { baseUrl?: string }) =>
        useModels({ baseUrl, fetcher }),
      { initialProps: { baseUrl: 'https://api.example.com/v1' as string | undefined } },
    )

    await waitFor(() => {
      expect(result.current.models).toHaveLength(3)
    })

    rerender({ baseUrl: undefined })

    await waitFor(() => {
      expect(result.current.models).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  // 11. Custom normalizer
  it('uses custom normalizer when provided', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
        normalizer: (raw) => ({
          id: String(raw.id),
          name: `Custom: ${(raw.model_spec as Record<string, unknown>)?.name ?? raw.id}`,
          type: 'text' as const,
          provider: 'custom-provider',
          created: 0,
          is_favorite: false,
          context_length: 0,
          pricing: {},
        }),
      }),
    )

    await waitFor(() => {
      expect(result.current.models).toHaveLength(3)
    })

    expect(result.current.models[0].name).toBe('Custom: GPT-4')
    expect(result.current.models[0].provider).toBe('custom-provider')
  })

  // 12. Custom responseExtractor
  it('uses custom responseExtractor when provided', async () => {
    const customData = [
      { id: 'custom-model', type: 'text', name: 'Custom Model' },
    ]
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ results: { items: customData } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
        responseExtractor: (body) =>
          (body as Record<string, Record<string, unknown[]>>).results.items as Record<string, unknown>[],
      }),
    )

    await waitFor(() => {
      expect(result.current.models).toHaveLength(1)
    })

    expect(result.current.models[0].id).toBe('custom-model')
  })

  // 13. Abort on unmount
  it('aborts in-flight request on unmount', async () => {
    const fetcher = createFetchMock(mockApiResponse.data, 500) // 500ms delay

    const { unmount } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      }),
    )

    // Unmount before fetch completes
    unmount()

    // The fetcher should have been called with an AbortSignal
    expect(fetcher).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    )
  })

  // 14. Re-fetch on baseUrl change
  it('re-fetches when baseUrl changes', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result, rerender } = renderHook(
      ({ baseUrl }: { baseUrl: string }) =>
        useModels({ baseUrl, fetcher }),
      { initialProps: { baseUrl: 'https://api.example.com/v1' } },
    )

    await waitFor(() => {
      expect(result.current.models).toHaveLength(3)
    })

    rerender({ baseUrl: 'https://api.other.com/v1' })

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  // 15. Re-fetch on apiKey change
  it('re-fetches when apiKey changes', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { rerender } = renderHook(
      ({ apiKey }: { apiKey?: string }) =>
        useModels({ baseUrl: 'https://api.example.com/v1', apiKey, fetcher }),
      { initialProps: { apiKey: 'key-1' as string | undefined } },
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    rerender({ apiKey: 'key-2' })

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  // 16. Type filtering — video
  it('filters to only video models when type="video"', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        type: 'video',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.models).toHaveLength(1)
    expect(result.current.models[0].id).toBe('wan-video')
    expect(result.current.models[0].type).toBe('video')
  })

  // 17. Rejects javascript: baseUrl scheme
  it('rejects javascript: baseUrl with an error', async () => {
    const fetcher = createFetchMock([])

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'javascript:alert(1)',
        fetcher,
      }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toMatch(/Invalid baseUrl scheme/)
    expect(result.current.models).toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  // 18. Rejects data: baseUrl scheme
  it('rejects data: baseUrl with an error', async () => {
    const fetcher = createFetchMock([])

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'data:application/json,{"data":[]}',
        fetcher,
      }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toMatch(/Invalid baseUrl scheme/)
    expect(result.current.models).toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  // 19. Rejects file: baseUrl scheme
  it('rejects file: baseUrl with an error', async () => {
    const fetcher = createFetchMock([])

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'file:///etc/passwd',
        fetcher,
      }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toMatch(/Invalid baseUrl scheme/)
    expect(result.current.models).toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  // 20. Accepts http:// baseUrl scheme
  it('accepts http:// baseUrl scheme', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'http://localhost:3000/v1',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.models).toHaveLength(3)
  })

  // 21. Accepts HTTPS:// (case-insensitive) baseUrl scheme
  it('accepts case-insensitive HTTPS:// baseUrl scheme', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'HTTPS://api.example.com/v1',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.models).toHaveLength(3)
  })

  // 22. Strips trailing slashes from baseUrl
  it('strips trailing slashes from baseUrl', async () => {
    const fetcher = createFetchMock([])

    renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1///',
        queryParams: {},
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.example.com/v1/models',
        expect.any(Object),
      )
    })
  })

  // 23. Invalid JSON response shape (non-object/non-array)
  it('handles non-object JSON response gracefully', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify('hello'), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toMatch(/Invalid response/)
    expect(result.current.models).toEqual([])
  })

  // 24. Normalization failure for individual models
  it('skips models that fail normalization and warns in dev mode', async () => {
    const fetcher = createFetchMock(mockApiResponse.data)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
        normalizer: (raw) => {
          if (raw.id === 'dall-e-3') {
            throw new Error('Cannot normalize this model')
          }
          return {
            id: String(raw.id),
            name: String((raw.model_spec as Record<string, unknown>)?.name ?? raw.id),
            type: 'text' as const,
            provider: 'test',
            created: 0,
            is_favorite: false,
            context_length: 0,
            pricing: {},
          }
        },
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // The failing model (dall-e-3) should be excluded
    expect(result.current.models).toHaveLength(2)
    expect(result.current.models.find((m) => m.id === 'dall-e-3')).toBeUndefined()
    expect(result.current.models.find((m) => m.id === 'gpt-4')).toBeDefined()
    expect(result.current.models.find((m) => m.id === 'wan-video')).toBeDefined()

    // console.warn should have been called for the failing model
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('dall-e-3'),
      expect.any(Error),
    )

    warnSpy.mockRestore()
  })

  // 25. Network-level fetch failure (TypeError: Failed to fetch)
  it('sets error state when fetch rejects with a TypeError (network failure)', async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })

    const { result } = renderHook(() =>
      useModels({
        baseUrl: 'https://api.example.com/v1',
        fetcher,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(TypeError)
    expect(result.current.error!.message).toBe('Failed to fetch')
    expect(result.current.models).toEqual([])
  })

  // 26. AbortSignal.any fallback
  it('falls back gracefully when AbortSignal.any is not available', async () => {
    const originalAny = AbortSignal.any
    // @ts-expect-error — intentionally removing AbortSignal.any to test fallback
    delete AbortSignal.any

    try {
      const fetcher = createFetchMock(mockApiResponse.data)

      const { result } = renderHook(() =>
        useModels({
          baseUrl: 'https://api.example.com/v1',
          fetcher,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.models).toHaveLength(3)
    } finally {
      // Restore AbortSignal.any
      AbortSignal.any = originalAny
    }
  })
})
