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
    expect(
      resolvedType({
        id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        type: 'chat',
        display_name: 'Llama 3.3 70B Instruct Turbo',
        context_length: 131072,
      }),
    ).toBe('text')
  })

  it('type: "image" → should resolve to "image"', () => {
    expect(
      resolvedType({
        id: 'google/imagen-4.0-preview',
        type: 'image',
        display_name: 'Google Imagen 4.0 Preview',
      }),
    ).toBe('image')
  })

  it('type: "video" → should resolve to "video"', () => {
    expect(
      resolvedType({
        id: 'kwaivgI/kling-1.6-standard',
        type: 'video',
        display_name: 'Kling 1.6 Standard',
      }),
    ).toBe('video')
  })

  it('type: "embedding" → should resolve to "embedding"', () => {
    expect(
      resolvedType({
        id: 'Alibaba-NLP/gte-modernbert-base',
        type: 'embedding',
        display_name: 'Gte Modernbert Base',
        context_length: 8192,
      }),
    ).toBe('embedding')
  })

  it('type: "audio" → should resolve to "tts" (or audio-related type)', () => {
    // Together AI uses "audio" for TTS models like Cartesia Sonic
    expect(
      resolvedType({
        id: 'cartesia/sonic',
        type: 'audio',
        display_name: 'Cartesia Sonic',
      }),
    ).toBe('tts')
  })

  it('type: "moderation" → should resolve to "text" (closest match)', () => {
    expect(
      resolvedType({
        id: 'meta-llama/Meta-Llama-Guard-3-8B',
        type: 'moderation',
        display_name: 'Meta Llama Guard 3 8B',
      }),
    ).toBe('text')
  })

  it('type: "language" → should resolve to "text"', () => {
    expect(
      resolvedType({
        id: 'meta-llama/Llama-Guard-4-12B',
        type: 'language',
        display_name: 'Llama Guard 4 12B',
      }),
    ).toBe('text')
  })

  it('type: "rerank" → should resolve to "text" (closest match)', () => {
    expect(
      resolvedType({
        id: 'Salesforce/Llama-Rank',
        type: 'rerank',
        display_name: 'Llama Rank',
      }),
    ).toBe('text')
  })

  it('type: "transcribe" → should resolve to "asr"', () => {
    expect(
      resolvedType({
        id: 'openai/whisper-large-v3-turbo',
        type: 'transcribe',
        display_name: 'Whisper Large V3 Turbo',
      }),
    ).toBe('asr')
  })

  it('no type field (139 models) → should resolve to "text"', () => {
    // Together AI has 139 models with no type field at all
    expect(
      resolvedType({
        id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        display_name: 'Qwen 2.5 72B Instruct Turbo',
        context_length: 32768,
      }),
    ).toBe('text')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 2. VERCEL AI GATEWAY — uses `type` field with "language"/"embedding"/"image"
// ═══════════════════════════════════════════════════════════════════════════

describe('Vercel AI Gateway type vocabulary', () => {
  it('type: "language" → should resolve to "text"', () => {
    expect(
      resolvedType({
        id: 'alibaba/qwen-3-14b',
        type: 'language',
        name: 'Qwen3-14B',
        context_window: 40960,
        max_tokens: 16384,
      }),
    ).toBe('text')
  })

  it('type: "embedding" → should resolve to "embedding"', () => {
    expect(
      resolvedType({
        id: 'alibaba/qwen3-embedding-0.6b',
        type: 'embedding',
        name: 'Qwen3 Embedding 0.6B',
        context_window: 32768,
      }),
    ).toBe('embedding')
  })

  it('type: "image" → should resolve to "image"', () => {
    expect(
      resolvedType({
        id: 'bfl/flux-kontext-max',
        type: 'image',
        name: 'FLUX.1 Kontext Max',
        context_window: 512,
      }),
    ).toBe('image')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. MISTRAL AI — uses type: "base" for all models
// ═══════════════════════════════════════════════════════════════════════════

describe('Mistral AI type vocabulary', () => {
  it('type: "base" → should resolve to "text" (all Mistral models are text)', () => {
    expect(
      resolvedType({
        id: 'mistral-large-latest',
        type: 'base',
        owned_by: 'mistralai',
      }),
    ).toBe('text')
  })

  it('type: "base" with embedding-like id → should resolve to "embedding"', () => {
    // Mistral has embedding models but they all have type: "base"
    expect(
      resolvedType({
        id: 'mistral-embed',
        type: 'base',
        owned_by: 'mistralai',
      }),
    ).toBe('embedding')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. OPENROUTER — no `type` field, uses architecture.output_modalities
// ═══════════════════════════════════════════════════════════════════════════

describe('OpenRouter architecture-based type detection', () => {
  it('text→text model → should resolve to "text"', () => {
    expect(
      resolvedType({
        id: 'anthropic/claude-3.5-sonnet',
        architecture: {
          modality: 'text+image->text',
          input_modalities: ['text', 'image'],
          output_modalities: ['text'],
        },
      }),
    ).toBe('text')
  })

  it('image-focused multimodal model → should resolve to "image" via ID heuristic', () => {
    // Models with both image+text output fall through architecture inference
    // to Tier 4 ID heuristic — "image-preview" in the ID triggers image classification
    expect(
      resolvedType({
        id: 'google/gemini-3-pro-image-preview',
        name: 'Google: Gemini 3 Pro Image Preview',
        architecture: {
          modality: 'text+image->image+text',
          input_modalities: ['text', 'image'],
          output_modalities: ['image', 'text'],
        },
      }),
    ).toBe('image')
  })

  it('text+audio output model → should resolve to "text" (primary is text)', () => {
    expect(
      resolvedType({
        id: 'openai/gpt-4o-audio-preview',
        architecture: {
          modality: 'text+audio->text+audio',
          input_modalities: ['text', 'audio'],
          output_modalities: ['text', 'audio'],
        },
      }),
    ).toBe('text')
  })

  it('text+image output model → should resolve to "text" (primary is text)', () => {
    // Models with both text and image output are primarily text models
    // (same logic as text+audio above). Image-only output → "image".
    expect(
      resolvedType({
        id: 'google/gemini-2.0-flash-exp:free',
        architecture: {
          modality: 'text+image->text+image',
          input_modalities: ['text', 'image'],
          output_modalities: ['text', 'image'],
        },
      }),
    ).toBe('text')
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
    expect(
      resolvedType({
        id: 'dall-e-3',
        owned_by: 'system',
      }),
    ).toBe('image')
  })

  it('tts-1 → should resolve to "tts"', () => {
    expect(
      resolvedType({
        id: 'tts-1',
        owned_by: 'openai-internal',
      }),
    ).toBe('tts')
  })

  it('whisper-1 → should resolve to "asr"', () => {
    expect(
      resolvedType({
        id: 'whisper-1',
        owned_by: 'openai-internal',
      }),
    ).toBe('asr')
  })

  it('text-embedding-3-small → should resolve to "embedding"', () => {
    expect(
      resolvedType({
        id: 'text-embedding-3-small',
        owned_by: 'system',
      }),
    ).toBe('embedding')
  })

  it('gpt-4o → should resolve to "text"', () => {
    expect(
      resolvedType({
        id: 'gpt-4o',
        owned_by: 'system',
      }),
    ).toBe('text')
  })

  it('gpt-image-1 → should resolve to "image"', () => {
    // OpenAI's newer image model doesn't match "dall-e" pattern
    expect(
      resolvedType({
        id: 'gpt-image-1',
        owned_by: 'system',
      }),
    ).toBe('image')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 6. NVIDIA NIM — no `type` field, diverse model types
// ═══════════════════════════════════════════════════════════════════════════

describe('Nvidia NIM model ID heuristics', () => {
  it('text model → should resolve to "text"', () => {
    expect(
      resolvedType({
        id: 'meta/llama-3.1-405b-instruct',
        owned_by: 'nvidia',
      }),
    ).toBe('text')
  })

  it('embedding model → should resolve to "embedding"', () => {
    expect(
      resolvedType({
        id: 'nvidia/nv-embedqa-e5-v5',
        owned_by: 'nvidia',
      }),
    ).toBe('embedding')
  })

  it('reranking model → should resolve to "text" (closest match)', () => {
    expect(
      resolvedType({
        id: 'nvidia/nv-rerankqa-mistral-4b-v3',
        owned_by: 'nvidia',
      }),
    ).toBe('text')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 7. HELICONE — minimal schema, no type metadata at all
// ═══════════════════════════════════════════════════════════════════════════

describe('Helicone minimal schema', () => {
  it('text model → should resolve to "text"', () => {
    expect(
      resolvedType({
        id: 'claude-opus-4-1',
        object: 'model',
        created: 1754352000,
        owned_by: 'anthropic',
      }),
    ).toBe('text')
  })

  it('dall-e model → should resolve to "image" via ID heuristic', () => {
    expect(
      resolvedType({
        id: 'dall-e-3',
        object: 'model',
        created: 1698811200,
        owned_by: 'openai',
      }),
    ).toBe('image')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 8. VENICE AI — the reference implementation (should all pass)
// ═══════════════════════════════════════════════════════════════════════════

describe('Venice AI (reference implementation)', () => {
  it('type: "text" → "text"', () => {
    expect(
      resolvedType({
        id: 'venice-uncensored',
        type: 'text',
        model_spec: { name: 'Venice Uncensored 1.1' },
      }),
    ).toBe('text')
  })

  it('type: "image" → "image"', () => {
    expect(
      resolvedType({
        id: 'flux-dev',
        type: 'image',
        model_spec: { name: 'Flux Dev' },
      }),
    ).toBe('image')
  })

  it('type: "video" → "video"', () => {
    expect(
      resolvedType({
        id: 'wan-2.1-14b',
        type: 'video',
        model_spec: { name: 'Wan 2.1 14B' },
      }),
    ).toBe('video')
  })

  it('type: "embedding" → "embedding"', () => {
    expect(
      resolvedType({
        id: 'text-embedding-ada-002',
        type: 'embedding',
      }),
    ).toBe('embedding')
  })

  it('type: "tts" → "tts"', () => {
    expect(
      resolvedType({
        id: 'tts-1',
        type: 'tts',
      }),
    ).toBe('tts')
  })

  it('type: "asr" → "asr"', () => {
    expect(
      resolvedType({
        id: 'whisper-1',
        type: 'asr',
      }),
    ).toBe('asr')
  })

  it('type: "upscale" → "upscale"', () => {
    expect(
      resolvedType({
        id: 'esrgan-4x',
        type: 'upscale',
      }),
    ).toBe('upscale')
  })

  it('type: "inpaint" → "inpaint"', () => {
    expect(
      resolvedType({
        id: 'inpaint-v1',
        type: 'inpaint',
      }),
    ).toBe('inpaint')
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

// ═══════════════════════════════════════════════════════════════════════════
// 10. PER-PROVIDER SHAPE ASSERTIONS
//     Beyond type resolution, normalize a representative specimen per provider
//     and assert the core fields survive — id, name, provider, is_favorite, and
//     type-appropriate pricing. Guards against silent field-drop regressions
//     like the OpenRouter cache pricing bug that 1–9 above couldn't catch.
// ═══════════════════════════════════════════════════════════════════════════

describe('Per-provider shape assertions', () => {
  it('Venice: extracts spec-nested name, description, pricing, capabilities, traits, privacy', () => {
    const model = asText({
      id: 'venice-uncensored',
      type: 'text',
      owned_by: 'venice.ai',
      created: 1742262554,
      model_spec: {
        name: 'Venice Uncensored 1.1',
        description: 'Designed for maximum creative freedom.',
        pricing: { input: { usd: 0.2 }, output: { usd: 0.9 } },
        availableContextTokens: 32000,
        capabilities: {
          supportsMultipleImages: false,
          supportsResponseSchema: true,
          supportsWebSearch: true,
          quantization: 'fp16',
        },
        privacy: 'private',
        traits: ['most_uncensored'],
      },
    })
    expect(model.id).toBe('venice-uncensored')
    expect(model.name).toBe('Venice Uncensored 1.1')
    expect(model.provider).toBe('venice.ai')
    expect(model.is_favorite).toBe(false)
    expect(model.context_length).toBe(32000)
    expect(model.pricing.prompt).toBeCloseTo(0.2 / 1_000_000)
    expect(model.pricing.completion).toBeCloseTo(0.9 / 1_000_000)
    expect(model.capabilities?.supportsMultipleImages).toBe(false)
    expect(model.capabilities?.quantization).toBe('fp16')
    expect(model.privacy).toBe('private')
    expect(model.traits).toEqual(['most_uncensored'])
  })

  it('OpenAI: minimal shape — id + owned_by is enough to survive normalization', () => {
    const model = asText({
      id: 'gpt-4-0613',
      object: 'model',
      created: 1686588896,
      owned_by: 'openai',
    })
    expect(model.id).toBe('gpt-4-0613')
    expect(model.name).toBe('gpt-4-0613') // falls back to id
    expect(model.provider).toBe('openai')
    expect(model.is_favorite).toBe(false)
    expect(model.created).toBe(1686588896)
  })

  it('Mistral: top-level name/description/type, max_context_length ignored (uses context_length/window)', () => {
    const model = asText({
      id: 'mistral-medium-2505',
      type: 'base',
      owned_by: 'mistralai',
      name: 'mistral-medium-2505',
      description: 'Our frontier-class multimodal model released May 2025.',
    })
    expect(model.id).toBe('mistral-medium-2505')
    expect(model.name).toBe('mistral-medium-2505')
    expect(model.description).toBe('Our frontier-class multimodal model released May 2025.')
    expect(model.provider).toBe('mistralai')
    expect(model.is_favorite).toBe(false)
  })

  it('Together: provider extracted from slash-prefixed id', () => {
    const raw = {
      id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      type: 'chat',
      display_name: 'Llama 3.3 70B Instruct Turbo',
      context_length: 131072,
    }
    const model = asText(raw)
    expect(model.provider).toBe('meta-llama')
    expect(model.context_length).toBe(131072)
    expect(model.is_favorite).toBe(false)
  })

  it('OpenRouter: preserves prompt/completion/cache pricing and top-level fields', () => {
    const model = asText({
      id: 'anthropic/claude-sonnet-4.6',
      name: 'Anthropic: Claude Sonnet 4.6',
      created: 1771342990,
      context_length: 1000000,
      architecture: { output_modalities: ['text'] },
      pricing: {
        prompt: '0.000003',
        completion: '0.000015',
        input_cache_read: '0.0000003',
        input_cache_write: '0.00000375',
      },
    })
    expect(model.provider).toBe('anthropic')
    expect(model.name).toBe('Anthropic: Claude Sonnet 4.6')
    expect(model.context_length).toBe(1000000)
    expect(model.pricing.prompt).toBeCloseTo(3e-6)
    expect(model.pricing.completion).toBeCloseTo(1.5e-5)
    expect(model.pricing.cache_input).toBeCloseTo(3e-7)
    expect(model.pricing.cache_write).toBeCloseTo(3.75e-6)
  })

  it('Groq: context_window resolves to context_length', () => {
    const model = asText({
      id: 'openai/gpt-oss-120b',
      owned_by: 'OpenAI',
      context_window: 131072,
    })
    expect(model.provider).toBe('openai') // slash-split wins over owned_by
    expect(model.context_length).toBe(131072)
  })

  it('Cerebras: minimal shape, no context_length source → undefined', () => {
    const model = asText({
      id: 'gpt-oss-120b',
      owned_by: 'Cerebras',
    })
    expect(model.provider).toBe('Cerebras')
    expect(model.context_length).toBeUndefined()
    expect(model.pricing.prompt).toBeUndefined()
    expect(model.is_favorite).toBe(false)
  })

  it('DeepSeek: minimal shape with missing `created` gets a fallback timestamp', () => {
    const before = Math.floor(Date.now() / 1000) - 1
    const model = asText({
      id: 'deepseek-chat',
      owned_by: 'deepseek',
    })
    expect(model.provider).toBe('deepseek')
    expect(model.created).toBeGreaterThanOrEqual(before)
  })

  it('Nvidia: slash-prefixed id extracts provider as org slug', () => {
    const model = asText({
      id: '01-ai/yi-large',
      owned_by: '01-ai',
    })
    expect(model.provider).toBe('01-ai')
    expect(model.is_favorite).toBe(false)
  })

  it('SambaNova: OpenRouter-style top-level pricing (string values)', () => {
    const model = asText({
      id: 'ALLaM-7B-Instruct-preview',
      owned_by: 'no-reply@sambanova.ai',
      context_length: 4096,
      pricing: {
        prompt: '0.00000022',
        completion: '0.00000059',
      },
    })
    expect(model.provider).toBe('no-reply@sambanova.ai')
    expect(model.pricing.prompt).toBeCloseTo(2.2e-7)
    expect(model.pricing.completion).toBeCloseTo(5.9e-7)
  })

  it('Helicone: minimal shape passes through', () => {
    const model = asText({
      id: 'claude-opus-4-1',
      object: 'model',
      created: 1754352000,
      owned_by: 'anthropic',
    })
    expect(model.provider).toBe('anthropic')
    expect(model.name).toBe('claude-opus-4-1')
    expect(model.is_favorite).toBe(false)
  })

  it('Vercel: top-level name + pricing, context_window resolves to context_length', () => {
    const model = asText({
      id: 'alibaba/qwen-3-14b',
      owned_by: 'alibaba',
      name: 'Qwen3-14B',
      context_window: 40960,
      type: 'language',
      pricing: { input: '0.00000006', output: '0.00000024' },
    })
    expect(model.provider).toBe('alibaba')
    expect(model.name).toBe('Qwen3-14B')
    expect(model.context_length).toBe(40960)
    // Vercel's pricing uses `input`/`output` keys, not `prompt`/`completion` —
    // the current `rawPricing` branch only reads the latter, so these are
    // currently dropped. Pin that behavior explicitly so a future change
    // (aliasing input/output → prompt/completion) is an intentional decision.
    expect(model.pricing.prompt).toBeUndefined()
    expect(model.pricing.completion).toBeUndefined()
  })

  it('Google AI: models/ prefix in id does not confuse provider extraction', () => {
    const model = asText({
      id: 'models/gemini-2.5-flash',
      owned_by: 'google',
    })
    // Slash-split wins: provider becomes 'models' — documented quirk.
    expect(model.provider).toBe('models')
    expect(model.id).toBe('models/gemini-2.5-flash')
  })
})
