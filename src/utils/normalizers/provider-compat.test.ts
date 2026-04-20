/**
 * Provider Compatibility Tests
 *
 * These tests verify that defaultModelNormalizer correctly classifies models
 * from real-world OpenAI-compatible provider API responses.
 *
 * Each test uses actual model objects captured from provider /models endpoints
 * (stored in test-fixtures/providers/).
 *
 * The tests are grouped by failure mode:
 *   1. Provider uses different type vocabulary (Together AI, Vercel, Mistral)
 *   2. Provider uses structured metadata instead of `type` (OpenRouter)
 *   3. Provider has no type metadata at all (OpenAI, Nvidia, Helicone)
 */

import { describe, it, expect } from 'vitest'
import type { TextModel } from '../../types'
import { defaultModelNormalizer, defaultResponseExtractor } from './index'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Shorthand to normalize a raw model and return its resolved type */
function resolvedType(raw: Record<string, unknown>): string {
  return defaultModelNormalizer(raw).type
}

/** Normalize and cast to TextModel for field-level assertions. */
function asText(raw: Record<string, unknown>): TextModel {
  const model = defaultModelNormalizer(raw)
  if (model.type !== 'text') {
    throw new Error(`expected text model, got ${model.type}`)
  }
  return model
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. TOGETHER AI — uses `type` field but with different vocabulary
//    e.g. "chat" instead of "text", "audio" instead of "tts"
// ═══════════════════════════════════════════════════════════════════════════

describe('Together AI type vocabulary', () => {
  it('type: "chat" → should resolve to "text"', () => {
    expect(resolvedType({
      id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      type: 'chat',
      display_name: 'Llama 3.3 70B Instruct Turbo',
      context_length: 131072,
    })).toBe('text')
  })

  it('type: "image" → should resolve to "image"', () => {
    expect(resolvedType({
      id: 'google/imagen-4.0-preview',
      type: 'image',
      display_name: 'Google Imagen 4.0 Preview',
    })).toBe('image')
  })

  it('type: "video" → should resolve to "video"', () => {
    expect(resolvedType({
      id: 'kwaivgI/kling-1.6-standard',
      type: 'video',
      display_name: 'Kling 1.6 Standard',
    })).toBe('video')
  })

  it('type: "embedding" → should resolve to "embedding"', () => {
    expect(resolvedType({
      id: 'Alibaba-NLP/gte-modernbert-base',
      type: 'embedding',
      display_name: 'Gte Modernbert Base',
      context_length: 8192,
    })).toBe('embedding')
  })

  it('type: "audio" → should resolve to "tts" (or audio-related type)', () => {
    // Together AI uses "audio" for TTS models like Cartesia Sonic
    expect(resolvedType({
      id: 'cartesia/sonic',
      type: 'audio',
      display_name: 'Cartesia Sonic',
    })).toBe('tts')
  })

  it('type: "moderation" → should resolve to "text" (closest match)', () => {
    expect(resolvedType({
      id: 'meta-llama/Meta-Llama-Guard-3-8B',
      type: 'moderation',
      display_name: 'Meta Llama Guard 3 8B',
    })).toBe('text')
  })

  it('type: "language" → should resolve to "text"', () => {
    expect(resolvedType({
      id: 'meta-llama/Llama-Guard-4-12B',
      type: 'language',
      display_name: 'Llama Guard 4 12B',
    })).toBe('text')
  })

  it('type: "rerank" → should resolve to "text" (closest match)', () => {
    expect(resolvedType({
      id: 'Salesforce/Llama-Rank',
      type: 'rerank',
      display_name: 'Llama Rank',
    })).toBe('text')
  })

  it('type: "transcribe" → should resolve to "asr"', () => {
    expect(resolvedType({
      id: 'openai/whisper-large-v3-turbo',
      type: 'transcribe',
      display_name: 'Whisper Large V3 Turbo',
    })).toBe('asr')
  })

  it('no type field (139 models) → should resolve to "text"', () => {
    // Together AI has 139 models with no type field at all
    expect(resolvedType({
      id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      display_name: 'Qwen 2.5 72B Instruct Turbo',
      context_length: 32768,
    })).toBe('text')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 2. VERCEL AI GATEWAY — uses `type` field with "language"/"embedding"/"image"
// ═══════════════════════════════════════════════════════════════════════════

describe('Vercel AI Gateway type vocabulary', () => {
  it('type: "language" → should resolve to "text"', () => {
    expect(resolvedType({
      id: 'alibaba/qwen-3-14b',
      type: 'language',
      name: 'Qwen3-14B',
      context_window: 40960,
      max_tokens: 16384,
    })).toBe('text')
  })

  it('type: "embedding" → should resolve to "embedding"', () => {
    expect(resolvedType({
      id: 'alibaba/qwen3-embedding-0.6b',
      type: 'embedding',
      name: 'Qwen3 Embedding 0.6B',
      context_window: 32768,
    })).toBe('embedding')
  })

  it('type: "image" → should resolve to "image"', () => {
    expect(resolvedType({
      id: 'bfl/flux-kontext-max',
      type: 'image',
      name: 'FLUX.1 Kontext Max',
      context_window: 512,
    })).toBe('image')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. MISTRAL AI — uses type: "base" for all models
// ═══════════════════════════════════════════════════════════════════════════

describe('Mistral AI type vocabulary', () => {
  it('type: "base" → should resolve to "text" (all Mistral models are text)', () => {
    expect(resolvedType({
      id: 'mistral-large-latest',
      type: 'base',
      owned_by: 'mistralai',
    })).toBe('text')
  })

  it('type: "base" with embedding-like id → should resolve to "embedding"', () => {
    // Mistral has embedding models but they all have type: "base"
    expect(resolvedType({
      id: 'mistral-embed',
      type: 'base',
      owned_by: 'mistralai',
    })).toBe('embedding')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. OPENROUTER — no `type` field, uses architecture.output_modalities
// ═══════════════════════════════════════════════════════════════════════════

describe('OpenRouter architecture-based type detection', () => {
  it('text→text model → should resolve to "text"', () => {
    expect(resolvedType({
      id: 'anthropic/claude-3.5-sonnet',
      architecture: {
        modality: 'text+image->text',
        input_modalities: ['text', 'image'],
        output_modalities: ['text'],
      },
    })).toBe('text')
  })

  it('image-focused multimodal model → should resolve to "image" via ID heuristic', () => {
    // Models with both image+text output fall through architecture inference
    // to Tier 4 ID heuristic — "image-preview" in the ID triggers image classification
    expect(resolvedType({
      id: 'google/gemini-3-pro-image-preview',
      name: 'Google: Gemini 3 Pro Image Preview',
      architecture: {
        modality: 'text+image->image+text',
        input_modalities: ['text', 'image'],
        output_modalities: ['image', 'text'],
      },
    })).toBe('image')
  })

  it('text+audio output model → should resolve to "text" (primary is text)', () => {
    expect(resolvedType({
      id: 'openai/gpt-4o-audio-preview',
      architecture: {
        modality: 'text+audio->text+audio',
        input_modalities: ['text', 'audio'],
        output_modalities: ['text', 'audio'],
      },
    })).toBe('text')
  })

  it('text+image output model → should resolve to "text" (primary is text)', () => {
    // Models with both text and image output are primarily text models
    // (same logic as text+audio above). Image-only output → "image".
    expect(resolvedType({
      id: 'google/gemini-2.0-flash-exp:free',
      architecture: {
        modality: 'text+image->text+image',
        input_modalities: ['text', 'image'],
        output_modalities: ['text', 'image'],
      },
    })).toBe('text')
  })

  it('preserves cache pricing from input_cache_read / input_cache_write', () => {
    // OpenRouter uses input_cache_read/write, not cache_input/cache_write.
    // Pricing values arrive as strings in the API response.
    const model = asText({
      id: 'anthropic/claude-sonnet-4.6',
      name: 'Anthropic: Claude Sonnet 4.6',
      context_length: 1000000,
      architecture: {
        modality: 'text+image->text',
        input_modalities: ['text', 'image'],
        output_modalities: ['text'],
      },
      pricing: {
        prompt: '0.000003',
        completion: '0.000015',
        input_cache_read: '0.0000003',
        input_cache_write: '0.00000375',
      },
    })
    expect(model.pricing.prompt).toBeCloseTo(3e-6)
    expect(model.pricing.completion).toBeCloseTo(1.5e-5)
    expect(model.pricing.cache_input).toBeCloseTo(3e-7)
    expect(model.pricing.cache_write).toBeCloseTo(3.75e-6)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 5. OPENAI — no `type` field, relies on model ID heuristics
// ═══════════════════════════════════════════════════════════════════════════

describe('OpenAI model ID heuristics', () => {
  it('dall-e-3 → should resolve to "image"', () => {
    expect(resolvedType({
      id: 'dall-e-3',
      owned_by: 'system',
    })).toBe('image')
  })

  it('tts-1 → should resolve to "tts"', () => {
    expect(resolvedType({
      id: 'tts-1',
      owned_by: 'openai-internal',
    })).toBe('tts')
  })

  it('whisper-1 → should resolve to "asr"', () => {
    expect(resolvedType({
      id: 'whisper-1',
      owned_by: 'openai-internal',
    })).toBe('asr')
  })

  it('text-embedding-3-small → should resolve to "embedding"', () => {
    expect(resolvedType({
      id: 'text-embedding-3-small',
      owned_by: 'system',
    })).toBe('embedding')
  })

  it('gpt-4o → should resolve to "text"', () => {
    expect(resolvedType({
      id: 'gpt-4o',
      owned_by: 'system',
    })).toBe('text')
  })

  it('gpt-image-1 → should resolve to "image"', () => {
    // OpenAI's newer image model doesn't match "dall-e" pattern
    expect(resolvedType({
      id: 'gpt-image-1',
      owned_by: 'system',
    })).toBe('image')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 6. NVIDIA NIM — no `type` field, diverse model types
// ═══════════════════════════════════════════════════════════════════════════

describe('Nvidia NIM model ID heuristics', () => {
  it('text model → should resolve to "text"', () => {
    expect(resolvedType({
      id: 'meta/llama-3.1-405b-instruct',
      owned_by: 'nvidia',
    })).toBe('text')
  })

  it('embedding model → should resolve to "embedding"', () => {
    expect(resolvedType({
      id: 'nvidia/nv-embedqa-e5-v5',
      owned_by: 'nvidia',
    })).toBe('embedding')
  })

  it('reranking model → should resolve to "text" (closest match)', () => {
    expect(resolvedType({
      id: 'nvidia/nv-rerankqa-mistral-4b-v3',
      owned_by: 'nvidia',
    })).toBe('text')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 7. HELICONE — minimal schema, no type metadata at all
// ═══════════════════════════════════════════════════════════════════════════

describe('Helicone minimal schema', () => {
  it('text model → should resolve to "text"', () => {
    expect(resolvedType({
      id: 'claude-opus-4-1',
      object: 'model',
      created: 1754352000,
      owned_by: 'anthropic',
    })).toBe('text')
  })

  it('dall-e model → should resolve to "image" via ID heuristic', () => {
    expect(resolvedType({
      id: 'dall-e-3',
      object: 'model',
      created: 1698811200,
      owned_by: 'openai',
    })).toBe('image')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 8. VENICE AI — the reference implementation (should all pass)
// ═══════════════════════════════════════════════════════════════════════════

describe('Venice AI (reference implementation)', () => {
  it('type: "text" → "text"', () => {
    expect(resolvedType({
      id: 'venice-uncensored',
      type: 'text',
      model_spec: { name: 'Venice Uncensored 1.1' },
    })).toBe('text')
  })

  it('type: "image" → "image"', () => {
    expect(resolvedType({
      id: 'flux-dev',
      type: 'image',
      model_spec: { name: 'Flux Dev' },
    })).toBe('image')
  })

  it('type: "video" → "video"', () => {
    expect(resolvedType({
      id: 'wan-2.1-14b',
      type: 'video',
      model_spec: { name: 'Wan 2.1 14B' },
    })).toBe('video')
  })

  it('type: "embedding" → "embedding"', () => {
    expect(resolvedType({
      id: 'text-embedding-ada-002',
      type: 'embedding',
    })).toBe('embedding')
  })

  it('type: "tts" → "tts"', () => {
    expect(resolvedType({
      id: 'tts-1',
      type: 'tts',
    })).toBe('tts')
  })

  it('type: "asr" → "asr"', () => {
    expect(resolvedType({
      id: 'whisper-1',
      type: 'asr',
    })).toBe('asr')
  })

  it('type: "upscale" → "upscale"', () => {
    expect(resolvedType({
      id: 'esrgan-4x',
      type: 'upscale',
    })).toBe('upscale')
  })

  it('type: "inpaint" → "inpaint"', () => {
    expect(resolvedType({
      id: 'inpaint-v1',
      type: 'inpaint',
    })).toBe('inpaint')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 9. RESPONSE EXTRACTOR — different wrapper shapes
// ═══════════════════════════════════════════════════════════════════════════

describe('defaultResponseExtractor with provider shapes', () => {
  it('Together AI: top-level array', () => {
    const body = [{ id: 'model-1' }, { id: 'model-2' }]
    expect(defaultResponseExtractor(body)).toHaveLength(2)
  })

  it('OpenAI/OpenRouter/Venice: { data: [...] }', () => {
    const body = { object: 'list', data: [{ id: 'model-1' }] }
    expect(defaultResponseExtractor(body)).toHaveLength(1)
  })

  it('Helicone: { data: [...] }', () => {
    const body = { object: 'list', data: [{ id: 'claude-opus-4-1' }] }
    expect(defaultResponseExtractor(body)).toHaveLength(1)
  })

  it('Vercel: { data: [...] }', () => {
    const body = { object: 'list', data: [{ id: 'alibaba/qwen-3-14b', type: 'language' }] }
    expect(defaultResponseExtractor(body)).toHaveLength(1)
  })
})
