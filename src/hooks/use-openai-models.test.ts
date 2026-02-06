import { describe, it, expect } from 'vitest'
import {
  defaultModelNormalizer,
  defaultResponseExtractor,
  Model,
} from './use-openai-models'

describe('defaultResponseExtractor', () => {
  it('returns body as-is when it is an array', () => {
    const arr = [{ id: 'a' }, { id: 'b' }]
    expect(defaultResponseExtractor(arr)).toBe(arr)
  })

  it('returns body.data when present', () => {
    const data = [{ id: 'a' }]
    expect(defaultResponseExtractor({ data })).toBe(data)
  })

  it('returns body.models when data is absent', () => {
    const models = [{ id: 'b' }]
    expect(defaultResponseExtractor({ models })).toBe(models)
  })

  it('returns empty array for unrecognized shape', () => {
    expect(defaultResponseExtractor({ foo: 'bar' })).toEqual([])
  })
})

describe('defaultModelNormalizer', () => {
  // --- Standard OpenAI ---
  describe('OpenAI standard response', () => {
    it('normalizes a standard OpenAI model', () => {
      const raw = {
        id: 'gpt-4',
        name: 'GPT-4',
        owned_by: 'openai',
        created: 1700000000,
        context_length: 8192,
        pricing: { prompt: 0.00003, completion: 0.00006 },
      }

      const model = defaultModelNormalizer(raw)

      expect(model).toEqual<Model>({
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        created: 1700000000,
        description: undefined,
        context_length: 8192,
        pricing: { prompt: 0.00003, completion: 0.00006 },
        is_favorite: false,
      })
    })

    it('falls back name to id when name is missing', () => {
      const model = defaultModelNormalizer({
        id: 'gpt-3.5-turbo',
        owned_by: 'openai',
        created: 1700000000,
      })
      expect(model.name).toBe('gpt-3.5-turbo')
    })

    it('falls back provider to "Unknown" when owned_by is missing', () => {
      const model = defaultModelNormalizer({ id: 'some-model' })
      expect(model.provider).toBe('Unknown')
    })

    it('falls back provider to "Unknown" when owned_by is empty string', () => {
      const model = defaultModelNormalizer({ id: 'some-model', owned_by: '' })
      expect(model.provider).toBe('Unknown')
    })

    it('defaults context_length to 0 when missing', () => {
      const model = defaultModelNormalizer({ id: 'test' })
      expect(model.context_length).toBe(0)
    })

    it('defaults pricing to empty object when missing', () => {
      const model = defaultModelNormalizer({ id: 'test' })
      expect(model.pricing).toEqual({})
    })

    it('sets is_favorite to false', () => {
      const model = defaultModelNormalizer({ id: 'test' })
      expect(model.is_favorite).toBe(false)
    })
  })

  // --- OpenRouter ---
  describe('OpenRouter response', () => {
    it('extracts provider from slash-separated id', () => {
      const model = defaultModelNormalizer({
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus',
        context_length: 200000,
        pricing: { prompt: '0.000015', completion: '0.000075' },
        created: 1710000000,
      })

      expect(model.id).toBe('anthropic/claude-3-opus')
      expect(model.provider).toBe('anthropic')
      expect(model.name).toBe('Claude 3 Opus')
      expect(model.context_length).toBe(200000)
      // pricing is passed through as-is (strings)
      expect(model.pricing.prompt).toBe('0.000015')
      expect(model.pricing.completion).toBe('0.000075')
    })

    it('prefers slash-separated provider over owned_by', () => {
      const model = defaultModelNormalizer({
        id: 'meta/llama-3-70b',
        owned_by: 'meta-platforms',
      })
      expect(model.provider).toBe('meta')
    })
  })

  // --- Venice ---
  describe('Venice response', () => {
    it('normalizes Venice model with model_spec', () => {
      const raw = {
        id: 'venice-llama-3',
        model_spec: {
          name: 'Llama 3',
          description: 'Meta Llama 3 model',
          availableContextTokens: 32000,
          pricing: {
            input: { usd: 6 },
            output: { usd: 12 },
          },
        },
        created: 1710000000,
      }

      const model = defaultModelNormalizer(raw)

      expect(model.name).toBe('Llama 3')
      expect(model.description).toBe('Meta Llama 3 model')
      expect(model.context_length).toBe(32000)
      // Venice prices are per-million-tokens, normalized to per-token
      expect(model.pricing.prompt).toBe(6 / 1_000_000)
      expect(model.pricing.completion).toBe(12 / 1_000_000)
    })

    it('handles Venice model_spec with partial pricing (input only)', () => {
      const raw = {
        id: 'venice-free',
        model_spec: {
          name: 'Free Model',
          availableContextTokens: 8000,
          pricing: {
            input: { usd: 0 },
            output: {},
          },
        },
      }

      const model = defaultModelNormalizer(raw)
      expect(model.pricing.prompt).toBe(0)
      expect(model.pricing.completion).toBeUndefined()
    })

    it('does not use spec pricing if rawPricing is present', () => {
      const raw = {
        id: 'hybrid-model',
        pricing: { prompt: 0.001, completion: 0.002 },
        model_spec: {
          name: 'Hybrid',
          pricing: {
            input: { usd: 999 },
            output: { usd: 999 },
          },
        },
      }

      const model = defaultModelNormalizer(raw)
      // rawPricing takes precedence
      expect(model.pricing.prompt).toBe(0.001)
      expect(model.pricing.completion).toBe(0.002)
    })
  })

  // --- context_length variants ---
  describe('context_length resolution', () => {
    it('uses context_window when context_length is absent', () => {
      const model = defaultModelNormalizer({ id: 'test', context_window: 16384 })
      expect(model.context_length).toBe(16384)
    })

    it('prefers context_length over context_window', () => {
      const model = defaultModelNormalizer({
        id: 'test',
        context_length: 8192,
        context_window: 16384,
      })
      expect(model.context_length).toBe(8192)
    })

    it('handles string context_length', () => {
      const model = defaultModelNormalizer({ id: 'test', context_length: '4096' })
      expect(model.context_length).toBe(4096)
    })
  })

  // --- pricing from metadata / cost ---
  describe('pricing fallbacks', () => {
    it('uses metadata.pricing when pricing is absent', () => {
      const model = defaultModelNormalizer({
        id: 'test',
        metadata: { pricing: { prompt: 0.01, completion: 0.02 } },
      })
      expect(model.pricing.prompt).toBe(0.01)
      expect(model.pricing.completion).toBe(0.02)
    })

    it('uses cost when pricing and metadata.pricing are absent', () => {
      const model = defaultModelNormalizer({
        id: 'test',
        cost: { prompt: 0.05, completion: 0.10 },
      })
      expect(model.pricing.prompt).toBe(0.05)
      expect(model.pricing.completion).toBe(0.10)
    })
  })

  // --- created ---
  describe('created field', () => {
    it('uses created from raw when available', () => {
      const model = defaultModelNormalizer({ id: 'test', created: 1234567890 })
      expect(model.created).toBe(1234567890)
    })

    it('handles string created', () => {
      const model = defaultModelNormalizer({ id: 'test', created: '1234567890' })
      expect(model.created).toBe(1234567890)
    })

    it('falls back to current time when created is missing', () => {
      const before = Math.floor(Date.now() / 1000)
      const model = defaultModelNormalizer({ id: 'test' })
      const after = Math.floor(Date.now() / 1000)
      expect(model.created).toBeGreaterThanOrEqual(before)
      expect(model.created).toBeLessThanOrEqual(after)
    })
  })

  // --- model_id fallback ---
  describe('id resolution', () => {
    it('uses model_id when id is missing', () => {
      const model = defaultModelNormalizer({ model_id: 'alt-id' })
      expect(model.id).toBe('alt-id')
    })

    it('throws when both id and model_id are missing', () => {
      expect(() => defaultModelNormalizer({})).toThrow('Model missing required id field')
    })

    it('throws when id is empty string and model_id is missing', () => {
      expect(() => defaultModelNormalizer({ id: '' })).toThrow('Model missing required id field')
    })
  })

  // --- description ---
  describe('description', () => {
    it('uses spec description over raw description', () => {
      const model = defaultModelNormalizer({
        id: 'test',
        description: 'raw desc',
        model_spec: { description: 'spec desc' },
      })
      expect(model.description).toBe('spec desc')
    })

    it('falls back to raw description', () => {
      const model = defaultModelNormalizer({
        id: 'test',
        description: 'raw desc',
      })
      expect(model.description).toBe('raw desc')
    })

    it('is undefined when no description available', () => {
      const model = defaultModelNormalizer({ id: 'test' })
      expect(model.description).toBeUndefined()
    })
  })
})
