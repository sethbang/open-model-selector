import { describe, it, expect } from 'vitest'
import {
  defaultModelNormalizer,
  defaultResponseExtractor,
  normalizeTextModel,
  normalizeImageModel,
  normalizeVideoModel,
  normalizeInpaintModel,
  normalizeEmbeddingModel,
  normalizeTtsModel,
  normalizeAsrModel,
  normalizeUpscaleModel,
  inferTypeFromId,
  MODEL_ID_TYPE_PATTERNS,
} from './index'
import { toNum, extractBaseFields } from './index'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Minimal raw model object — just an id */
const raw = (id: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id,
  ...extra,
})

/** Venice-style raw model with model_spec */
const veniceRaw = (
  id: string,
  type: string,
  specOverrides: Record<string, unknown> = {},
  topOverrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id,
  type,
  model_spec: {
    name: `${id}-display`,
    description: `Description for ${id}`,
    ...specOverrides,
  },
  ...topOverrides,
})

// ═══════════════════════════════════════════════════════════════════════════
// toNum
// ═══════════════════════════════════════════════════════════════════════════

describe('toNum', () => {
  it('converts a number', () => {
    expect(toNum(42)).toBe(42)
  })

  it('converts a numeric string', () => {
    expect(toNum('42')).toBe(42)
  })

  it('returns undefined for null', () => {
    expect(toNum(null)).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(toNum(undefined)).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(toNum('')).toBeUndefined()
  })

  it('returns undefined for non-numeric string', () => {
    expect(toNum('abc')).toBeUndefined()
  })

  it('returns undefined for NaN', () => {
    expect(toNum(NaN)).toBeUndefined()
  })

  it('converts zero', () => {
    expect(toNum(0)).toBe(0)
  })

  it('converts negative numbers', () => {
    expect(toNum(-5)).toBe(-5)
  })

  it('converts float strings', () => {
    expect(toNum('3.14')).toBeCloseTo(3.14)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// defaultResponseExtractor
// ═══════════════════════════════════════════════════════════════════════════

describe('defaultResponseExtractor', () => {
  it('returns top-level array as-is', () => {
    const arr = [{ id: 'a' }, { id: 'b' }]
    expect(defaultResponseExtractor(arr)).toBe(arr)
  })

  it('extracts { data: [...] }', () => {
    const data = [{ id: 'c' }]
    expect(defaultResponseExtractor({ data })).toBe(data)
  })

  it('extracts { models: [...] }', () => {
    const models = [{ id: 'd' }]
    expect(defaultResponseExtractor({ models })).toBe(models)
  })

  it('returns [] for unrecognized shape', () => {
    expect(defaultResponseExtractor({ results: [1, 2, 3] })).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// extractBaseFields
// ═══════════════════════════════════════════════════════════════════════════

describe('extractBaseFields', () => {
  it('extracts id from raw.id', () => {
    const result = extractBaseFields({ id: 'gpt-4o' })
    expect(result.id).toBe('gpt-4o')
  })

  it('falls back to raw.model_id', () => {
    const result = extractBaseFields({ model_id: 'claude-3' })
    expect(result.id).toBe('claude-3')
  })

  it('throws when id is missing', () => {
    expect(() => extractBaseFields({})).toThrow('Model missing required id field')
  })

  it('extracts name from spec.name (Venice)', () => {
    const result = extractBaseFields(
      { id: 'x', model_spec: { name: 'Venice Name' } },
    )
    expect(result.name).toBe('Venice Name')
  })

  it('falls back to raw.name', () => {
    const result = extractBaseFields({ id: 'x', name: 'Raw Name' })
    expect(result.name).toBe('Raw Name')
  })

  it('falls back to id for name', () => {
    const result = extractBaseFields({ id: 'fallback-id' })
    expect(result.name).toBe('fallback-id')
  })

  it('extracts provider from slash-separated id', () => {
    const result = extractBaseFields({ id: 'anthropic/claude-3' })
    expect(result.provider).toBe('anthropic')
  })

  it('falls back to owned_by for provider', () => {
    const result = extractBaseFields({ id: 'gpt-4o', owned_by: 'openai' })
    expect(result.provider).toBe('openai')
  })

  it('defaults provider to "Unknown" when nothing available', () => {
    const result = extractBaseFields({ id: 'gpt-4o' })
    expect(result.provider).toBe('Unknown')
  })

  it('extracts Venice-specific fields from model_spec', () => {
    const result = extractBaseFields({
      id: 'venice-model',
      model_spec: {
        betaModel: true,
        privacy: 'private',
        offline: false,
        modelSource: 'huggingface',
        traits: ['fast', 'cheap'],
        deprecation: { date: '2025-12-31' },
      },
    })
    expect(result.betaModel).toBe(true)
    expect(result.privacy).toBe('private')
    expect(result.offline).toBe(false)
    expect(result.modelSource).toBe('huggingface')
    expect(result.traits).toEqual(['fast', 'cheap'])
    expect(result.deprecation).toEqual({ date: '2025-12-31' })
  })

  it('always sets is_favorite to false', () => {
    const result = extractBaseFields({ id: 'x' })
    expect(result.is_favorite).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// inferTypeFromId
// ═══════════════════════════════════════════════════════════════════════════

describe('inferTypeFromId', () => {
  it('infers "embedding" from text-embedding-ada-002', () => {
    expect(inferTypeFromId('text-embedding-ada-002')).toBe('embedding')
  })

  it('infers "embedding" from text-embedding-3-small', () => {
    expect(inferTypeFromId('text-embedding-3-small')).toBe('embedding')
  })

  it('infers "image" from dall-e-3', () => {
    expect(inferTypeFromId('dall-e-3')).toBe('image')
  })

  it('infers "image" from stable-diffusion-xl', () => {
    expect(inferTypeFromId('stable-diffusion-xl')).toBe('image')
  })

  it('infers "image" from flux-dev', () => {
    expect(inferTypeFromId('flux-dev')).toBe('image')
  })

  it('infers "tts" from tts-1', () => {
    expect(inferTypeFromId('tts-1')).toBe('tts')
  })

  it('infers "tts" from tts-1-hd', () => {
    expect(inferTypeFromId('tts-1-hd')).toBe('tts')
  })

  it('infers "asr" from whisper-1', () => {
    expect(inferTypeFromId('whisper-1')).toBe('asr')
  })

  it('infers "video" from sora-v1', () => {
    expect(inferTypeFromId('sora-v1')).toBe('video')
  })

  it('infers "video" from wan-2.1-14b', () => {
    expect(inferTypeFromId('wan-2.1-14b')).toBe('video')
  })

  it('infers "inpaint" from inpaint-model', () => {
    expect(inferTypeFromId('inpaint-model')).toBe('inpaint')
  })

  it('infers "upscale" from esrgan-4x', () => {
    expect(inferTypeFromId('esrgan-4x')).toBe('upscale')
  })

  it('does NOT match "vision" as "video"', () => {
    expect(inferTypeFromId('gpt-4-vision-preview')).toBeUndefined()
  })

  it('returns undefined for gpt-4o (unknown)', () => {
    expect(inferTypeFromId('gpt-4o')).toBeUndefined()
  })

  it('returns undefined for my-custom-model', () => {
    expect(inferTypeFromId('my-custom-model')).toBeUndefined()
  })

  it('returns undefined for claude-3.5-sonnet', () => {
    expect(inferTypeFromId('claude-3.5-sonnet')).toBeUndefined()
  })

  it('MODEL_ID_TYPE_PATTERNS is exported and non-empty', () => {
    expect(MODEL_ID_TYPE_PATTERNS.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// defaultModelNormalizer — dispatching
// ═══════════════════════════════════════════════════════════════════════════

describe('defaultModelNormalizer', () => {
  it('Venice text model → TextModel', () => {
    const result = defaultModelNormalizer(veniceRaw('llama-3.1', 'text'))
    expect(result.type).toBe('text')
    expect(result.id).toBe('llama-3.1')
  })

  it('Venice image model → ImageModel', () => {
    const result = defaultModelNormalizer(veniceRaw('flux-dev', 'image'))
    expect(result.type).toBe('image')
  })

  it('Venice video model → VideoModel', () => {
    const result = defaultModelNormalizer(veniceRaw('wan-2.1', 'video'))
    expect(result.type).toBe('video')
  })

  it('no type + embedding id → EmbeddingModel via heuristic', () => {
    const result = defaultModelNormalizer(raw('text-embedding-ada-002'))
    expect(result.type).toBe('embedding')
  })

  it('no type + dall-e-3 id → ImageModel via heuristic', () => {
    const result = defaultModelNormalizer(raw('dall-e-3'))
    expect(result.type).toBe('image')
  })

  it('no type + tts-1 id → TtsModel via heuristic', () => {
    const result = defaultModelNormalizer(raw('tts-1'))
    expect(result.type).toBe('tts')
  })

  it('no type + whisper-1 id → AsrModel via heuristic', () => {
    const result = defaultModelNormalizer(raw('whisper-1'))
    expect(result.type).toBe('asr')
  })

  it('no type + unknown id → TextModel (fallback)', () => {
    const result = defaultModelNormalizer(raw('gpt-4o'))
    expect(result.type).toBe('text')
  })

  it('invalid type "banana" → falls through to heuristic/text', () => {
    const result = defaultModelNormalizer({ id: 'gpt-4o', type: 'banana' })
    expect(result.type).toBe('text')
  })

  it('type: "embedding" → EmbeddingModel', () => {
    const result = defaultModelNormalizer({ id: 'custom-embed', type: 'embedding' })
    expect(result.type).toBe('embedding')
  })

  it('type: "tts" → TtsModel', () => {
    const result = defaultModelNormalizer({ id: 'custom-tts', type: 'tts' })
    expect(result.type).toBe('tts')
  })

  it('type: "asr" → AsrModel', () => {
    const result = defaultModelNormalizer({ id: 'custom-asr', type: 'asr' })
    expect(result.type).toBe('asr')
  })

  it('type: "upscale" → UpscaleModel', () => {
    const result = defaultModelNormalizer({ id: 'my-upscaler', type: 'upscale' })
    expect(result.type).toBe('upscale')
  })

  it('type: "inpaint" → InpaintModel', () => {
    const result = defaultModelNormalizer({ id: 'my-inpainter', type: 'inpaint' })
    expect(result.type).toBe('inpaint')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// normalizeTextModel
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeTextModel', () => {
  it('full Venice text model with model_spec', () => {
    const result = normalizeTextModel({
      id: 'llama-3.3-70b',
      type: 'text',
      model_spec: {
        name: 'Llama 3.3 70B',
        description: 'Meta model',
        availableContextTokens: 131072,
        pricing: {
          input: { usd: 0.36, diem: 0.36 },
          output: { usd: 0.54, diem: 0.54 },
        },
        capabilities: {
          optimizedForCode: false,
          supportsVision: true,
          supportsReasoning: false,
          supportsFunctionCalling: true,
        },
        constraints: {
          temperature: { default: 0.7 },
          top_p: { default: 0.9 },
        },
      },
    })
    expect(result.type).toBe('text')
    expect(result.id).toBe('llama-3.3-70b')
    expect(result.name).toBe('Llama 3.3 70B')
    expect(result.context_length).toBe(131072)
    // Venice pricing: per-million → per-token
    expect(result.pricing.prompt).toBeCloseTo(0.36 / 1_000_000)
    expect(result.pricing.completion).toBeCloseTo(0.54 / 1_000_000)
    expect(result.capabilities?.supportsVision).toBe(true)
    expect(result.capabilities?.supportsFunctionCalling).toBe(true)
    expect(result.constraints?.temperature).toEqual({ default: 0.7 })
  })

  it('OpenRouter pricing (per-token) used as-is', () => {
    const result = normalizeTextModel({
      id: 'openrouter/gpt-4o',
      pricing: { prompt: 0.000005, completion: 0.000015 },
    })
    expect(result.pricing.prompt).toBe(0.000005)
    expect(result.pricing.completion).toBe(0.000015)
  })

  it('metadata.pricing fallback', () => {
    const result = normalizeTextModel({
      id: 'meta-model',
      metadata: { pricing: { prompt: 0.00001, completion: 0.00002 } },
    })
    expect(result.pricing.prompt).toBe(0.00001)
    expect(result.pricing.completion).toBe(0.00002)
  })

  it('cost fallback', () => {
    const result = normalizeTextModel({
      id: 'cost-model',
      cost: { prompt: 0.00003, completion: 0.00006 },
    })
    expect(result.pricing.prompt).toBe(0.00003)
    expect(result.pricing.completion).toBe(0.00006)
  })

  it('context_length from context_length field', () => {
    const result = normalizeTextModel({ id: 'x', context_length: 8192 })
    expect(result.context_length).toBe(8192)
  })

  it('context_length from context_window field', () => {
    const result = normalizeTextModel({ id: 'x', context_window: 4096 })
    expect(result.context_length).toBe(4096)
  })

  it('context_length from spec.availableContextTokens', () => {
    const result = normalizeTextModel({
      id: 'x',
      model_spec: { availableContextTokens: 131072 },
    })
    expect(result.context_length).toBe(131072)
  })

  it('missing pricing → empty pricing object', () => {
    const result = normalizeTextModel({ id: 'x' })
    expect(result.pricing.prompt).toBeUndefined()
    expect(result.pricing.completion).toBeUndefined()
  })

  it('missing everything except id → valid TextModel with defaults', () => {
    const result = normalizeTextModel({ id: 'bare-model' })
    expect(result.type).toBe('text')
    expect(result.id).toBe('bare-model')
    expect(result.context_length).toBe(0)
    expect(result.capabilities).toBeUndefined()
    expect(result.constraints).toBeUndefined()
    expect(result.is_favorite).toBe(false)
  })

  it('cache pricing from Venice spec', () => {
    const result = normalizeTextModel({
      id: 'cache-model',
      model_spec: {
        pricing: {
          input: { usd: 1.0 },
          output: { usd: 2.0 },
          cache_input: { usd: 0.5 },
          cache_write: { usd: 0.75 },
        },
      },
    })
    expect(result.pricing.cache_input).toBeCloseTo(0.5 / 1_000_000)
    expect(result.pricing.cache_write).toBeCloseTo(0.75 / 1_000_000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// normalizeImageModel
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeImageModel', () => {
  it('full Venice image model', () => {
    const result = normalizeImageModel({
      id: 'flux-dev',
      type: 'image',
      model_spec: {
        name: 'Flux Dev',
        pricing: {
          generation: { usd: 0.04 },
          upscale: {
            '2x': { usd: 0.02 },
            '4x': { usd: 0.06 },
          },
        },
        constraints: {
          promptCharacterLimit: 1000,
          steps: { default: 30, max: 50 },
          widthHeightDivisor: 8,
          aspectRatios: ['1:1', '16:9'],
          defaultAspectRatio: '1:1',
        },
        supportsWebSearch: true,
      },
    })
    expect(result.type).toBe('image')
    expect(result.pricing.generation).toBe(0.04)
    expect(result.pricing.upscale_2x).toBe(0.02)
    expect(result.pricing.upscale_4x).toBe(0.06)
    expect(result.constraints?.steps).toEqual({ default: 30, max: 50 })
    expect(result.constraints?.widthHeightDivisor).toBe(8)
    expect(result.supportsWebSearch).toBe(true)
  })

  it('resolution-based pricing normalization', () => {
    const result = normalizeImageModel({
      id: 'nano-banana',
      model_spec: {
        pricing: {
          resolutions: {
            '1K': { usd: 0.18, diem: 0.18 },
            '2K': { usd: 0.24, diem: 0.24 },
          },
        },
      },
    })
    expect(result.pricing.resolutions).toEqual({ '1K': 0.18, '2K': 0.24 })
  })

  it('supportsWebSearch from spec, not constraints', () => {
    const result = normalizeImageModel({
      id: 'img',
      model_spec: {
        supportsWebSearch: false,
      },
    })
    expect(result.supportsWebSearch).toBe(false)
  })

  it('missing constraints → undefined', () => {
    const result = normalizeImageModel({ id: 'img' })
    expect(result.constraints).toBeUndefined()
  })

  it('missing pricing → undefined fields', () => {
    const result = normalizeImageModel({ id: 'img' })
    expect(result.pricing.generation).toBeUndefined()
    expect(result.pricing.upscale_2x).toBeUndefined()
    expect(result.pricing.upscale_4x).toBeUndefined()
  })

  it('aspect ratios and steps extraction', () => {
    const result = normalizeImageModel({
      id: 'img',
      model_spec: {
        constraints: {
          aspectRatios: ['1:1', '4:3', '16:9'],
          steps: { default: 20, max: 40 },
        },
      },
    })
    expect(result.constraints?.aspectRatios).toEqual(['1:1', '4:3', '16:9'])
    expect(result.constraints?.steps).toEqual({ default: 20, max: 40 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// normalizeVideoModel
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeVideoModel', () => {
  it('full Venice video model', () => {
    const result = normalizeVideoModel({
      id: 'wan-2.1-14b',
      type: 'video',
      model_spec: {
        name: 'Wan 2.1 14B',
        deprecation: { date: '2026-06-01' },
        constraints: {
          model_type: 'text-to-video',
          aspect_ratios: ['16:9', '9:16'],
          resolutions: ['720p', '1080p'],
          durations: ['5', '10'],
          audio: false,
          audio_configurable: true,
        },
        model_sets: ['standard', 'premium'],
      },
    })
    expect(result.type).toBe('video')
    expect(result.constraints?.model_type).toBe('text-to-video')
    expect(result.constraints?.aspect_ratios).toEqual(['16:9', '9:16'])
    expect(result.constraints?.durations).toEqual(['5', '10'])
    expect(result.constraints?.audio).toBe(false)
    expect(result.model_sets).toEqual(['standard', 'premium'])
    expect(result.deprecation).toEqual({ date: '2026-06-01' })
  })

  it('no pricing property on VideoModel', () => {
    const result = normalizeVideoModel({ id: 'vid' })
    expect((result as unknown as Record<string, unknown>).pricing).toBeUndefined()
  })

  it('missing constraints → undefined', () => {
    const result = normalizeVideoModel({ id: 'vid' })
    expect(result.constraints).toBeUndefined()
  })

  it('model_sets from top-level raw fallback', () => {
    const result = normalizeVideoModel({ id: 'vid', model_sets: ['basic'] })
    expect(result.model_sets).toEqual(['basic'])
  })

  it('audio and video input constraints', () => {
    const result = normalizeVideoModel({
      id: 'vid',
      model_spec: {
        constraints: {
          audio_input: true,
          video_input: true,
        },
      },
    })
    expect(result.constraints?.audio_input).toBe(true)
    expect(result.constraints?.video_input).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// normalizeEmbeddingModel
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeEmbeddingModel', () => {
  it('Venice embedding with input and output pricing', () => {
    const result = normalizeEmbeddingModel({
      id: 'text-embedding-ada-002',
      model_spec: {
        pricing: {
          input: { usd: 0.1 },
          output: { usd: 0.1 },
        },
      },
    })
    expect(result.type).toBe('embedding')
    expect(result.pricing.input).toBeCloseTo(0.1 / 1_000_000)
    expect(result.pricing.output).toBeCloseTo(0.1 / 1_000_000)
  })

  it('missing pricing → undefined fields', () => {
    const result = normalizeEmbeddingModel({ id: 'embed' })
    expect(result.pricing.input).toBeUndefined()
    expect(result.pricing.output).toBeUndefined()
  })

  it('base fields are correct', () => {
    const result = normalizeEmbeddingModel({ id: 'openai/embed-v3', name: 'Embed V3' })
    expect(result.id).toBe('openai/embed-v3')
    expect(result.provider).toBe('openai')
    expect(result.name).toBe('Embed V3')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// normalizeTtsModel
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeTtsModel', () => {
  it('Venice TTS with pricing and voices', () => {
    const result = normalizeTtsModel({
      id: 'tts-1',
      model_spec: {
        pricing: { input: { usd: 15.0 } },
        voices: ['alloy', 'echo', 'fable'],
      },
    })
    expect(result.type).toBe('tts')
    expect(result.pricing.input).toBeCloseTo(15.0 / 1_000_000)
    expect(result.voices).toEqual(['alloy', 'echo', 'fable'])
  })

  it('missing voices → undefined', () => {
    const result = normalizeTtsModel({ id: 'tts-1' })
    expect(result.voices).toBeUndefined()
  })

  it('per-million conversion for pricing', () => {
    const result = normalizeTtsModel({
      id: 'tts-hd',
      model_spec: { pricing: { input: { usd: 30.0 } } },
    })
    expect(result.pricing.input).toBeCloseTo(30.0 / 1_000_000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// normalizeAsrModel
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeAsrModel', () => {
  it('Venice ASR with per_audio_second pricing', () => {
    const result = normalizeAsrModel({
      id: 'whisper-1',
      model_spec: {
        pricing: {
          per_audio_second: { usd: 0.006 },
        },
      },
    })
    expect(result.type).toBe('asr')
    expect(result.pricing.per_audio_second).toBe(0.006)
  })

  it('missing pricing → undefined', () => {
    const result = normalizeAsrModel({ id: 'whisper-1' })
    expect(result.pricing.per_audio_second).toBeUndefined()
  })

  it('base fields correct', () => {
    const result = normalizeAsrModel({ id: 'whisper-1', owned_by: 'openai' })
    expect(result.id).toBe('whisper-1')
    expect(result.provider).toBe('openai')
    expect(result.is_favorite).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// normalizeInpaintModel
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeInpaintModel', () => {
  it('full inpaint model', () => {
    const result = normalizeInpaintModel({
      id: 'inpaint-v1',
      model_spec: {
        pricing: { generation: { usd: 0.05 } },
        constraints: {
          aspectRatios: ['1:1', '4:3'],
          combineImages: true,
        },
      },
    })
    expect(result.type).toBe('inpaint')
    expect(result.pricing.generation).toBe(0.05)
    expect(result.constraints?.aspectRatios).toEqual(['1:1', '4:3'])
    expect(result.constraints?.combineImages).toBe(true)
  })

  it('missing constraints → undefined', () => {
    const result = normalizeInpaintModel({ id: 'inpaint' })
    expect(result.constraints).toBeUndefined()
  })

  it('missing pricing → undefined generation', () => {
    const result = normalizeInpaintModel({ id: 'inpaint' })
    expect(result.pricing.generation).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// normalizeUpscaleModel
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeUpscaleModel', () => {
  it('full upscale model', () => {
    const result = normalizeUpscaleModel({
      id: 'esrgan-4x',
      model_spec: {
        pricing: { generation: { usd: 0.08 } },
      },
    })
    expect(result.type).toBe('upscale')
    expect(result.pricing.generation).toBe(0.08)
  })

  it('missing everything except id → valid UpscaleModel', () => {
    const result = normalizeUpscaleModel({ id: 'upscale-bare' })
    expect(result.type).toBe('upscale')
    expect(result.id).toBe('upscale-bare')
    expect(result.pricing.generation).toBeUndefined()
    expect(result.is_favorite).toBe(false)
  })
})
