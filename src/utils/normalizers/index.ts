import type { ModelType, AnyModel } from '../../types'
import { inferTypeFromId } from './type-inference'
import { normalizeTextModel } from './text'
import { normalizeImageModel } from './image'
import { normalizeVideoModel } from './video'
import { normalizeInpaintModel } from './inpaint'
import { normalizeEmbeddingModel } from './embedding'
import { normalizeTtsModel } from './tts'
import { normalizeAsrModel } from './asr'
import { normalizeUpscaleModel } from './upscale'

// ---- Types ----

/** Function that extracts the array of raw model objects from an API response body. */
export type ResponseExtractor = (
  body: Record<string, unknown> | unknown[],
) => Record<string, unknown>[]

/** Function that normalizes a single raw model object into an AnyModel. */
export type ModelNormalizer = (raw: Record<string, unknown>) => AnyModel

// ---- Response Extractor ----

/** Default response extractor handling common API response shapes:
 *  - Top-level array → return as-is
 *  - `{ data: [...] }` (OpenAI standard) → return data
 *  - `{ models: [...] }` → return models
 *  - Fallback → empty array */
export function defaultResponseExtractor(
  body: Record<string, unknown> | unknown[],
): Record<string, unknown>[] {
  if (Array.isArray(body)) return body as Record<string, unknown>[]
  if (body && typeof body === 'object') {
    if (Array.isArray(body.data)) return body.data as Record<string, unknown>[]
    if (Array.isArray(body.models)) return body.models as Record<string, unknown>[]
  }
  return []
}

// ---- Dispatching Normalizer ----

const VALID_TYPES = new Set<string>([
  'text',
  'image',
  'video',
  'inpaint',
  'embedding',
  'tts',
  'asr',
  'upscale',
])

/** Maps provider-specific type strings to our canonical ModelType values.
 *  Covers vocabulary differences across Together AI, Vercel AI Gateway, Mistral, etc.
 *  Exported so consumers can inspect or extend. */
export const TYPE_ALIASES: Record<string, ModelType> = {
  // Together AI
  chat: 'text',
  language: 'text', // Vercel AI Gateway, Together AI
  base: 'text', // Mistral AI
  moderation: 'text', // Together AI
  rerank: 'text', // Together AI
  audio: 'tts', // Together AI (Cartesia Sonic etc.)
  transcribe: 'asr', // Together AI (Whisper etc.)
  // image, video, embedding already match VALID_TYPES directly
}

/** Infer type from OpenRouter-style `architecture.output_modalities` array.
 *  Returns a ModelType if a non-text output modality is detected, undefined otherwise. */
function inferTypeFromArchitecture(raw: Record<string, unknown>): ModelType | undefined {
  const arch = raw.architecture as Record<string, unknown> | undefined
  if (!arch) return undefined

  const outputMods = arch.output_modalities as string[] | undefined
  if (!Array.isArray(outputMods) || outputMods.length === 0) return undefined

  // If output modalities include 'image' WITHOUT 'text', classify as image model.
  // Models like gemini-2.0-flash that output text+image are primarily text models,
  // so we only classify as image when text is not also an output modality.
  if (outputMods.includes('image') && !outputMods.includes('text')) return 'image'
  // If output modalities include 'audio' (but not 'text' as primary), classify as tts.
  // Models like gpt-4o-audio that output text+audio are still primarily text models,
  // so we only classify as tts if audio is the sole output modality.
  if (outputMods.length === 1 && outputMods[0] === 'audio') return 'tts'

  return undefined
}

/** Default dispatching model normalizer.
 *  Uses multi-tier type resolution:
 *  1. Explicit `raw.type` field matching our canonical types (Venice, custom providers)
 *  2. Non-text alias mapping for provider-specific vocabulary (Together AI: "audio"→"tts")
 *  3. Architecture-based inference from `output_modalities` (OpenRouter)
 *  4. Heuristic inference from model ID patterns (OpenAI, Nvidia, etc.)
 *  5. Text-aliased type (Together AI: "chat"→"text", Mistral: "base"→"text")
 *  6. Fallback to 'text' — safe default for most providers
 *
 *  Note: aliases that resolve to 'text' are checked AFTER the ID heuristic (Tier 4)
 *  so that e.g. Mistral's `mistral-embed` (type: "base") still gets classified as
 *  'embedding' via its model ID rather than being swallowed by the "base"→"text" alias. */
export function defaultModelNormalizer(raw: Record<string, unknown>): AnyModel {
  const id = (raw.id as string) ?? (raw.model_id as string) ?? ''

  const rawType = raw.type as string | undefined

  // Resolve alias (if any) — split into text vs non-text for ordering
  const aliasedType = rawType && rawType in TYPE_ALIASES ? TYPE_ALIASES[rawType] : undefined

  const type: ModelType =
    // 1. Direct match against canonical types (Venice)
    (rawType && VALID_TYPES.has(rawType) ? (rawType as ModelType) : undefined) ??
    // 2. Non-text alias (e.g. "audio"→"tts", "transcribe"→"asr") — these are specific enough to trust
    (aliasedType && aliasedType !== 'text' ? aliasedType : undefined) ??
    // 3. Architecture-based inference (OpenRouter output_modalities)
    inferTypeFromArchitecture(raw) ??
    // 4. Heuristic from model ID patterns
    inferTypeFromId(id) ??
    // 5. Text-aliased type (e.g. "chat"→"text", "base"→"text", "language"→"text")
    aliasedType ??
    // 6. Default to 'text'
    'text'

  switch (type) {
    case 'text':
      return normalizeTextModel(raw)
    case 'image':
      return normalizeImageModel(raw)
    case 'video':
      return normalizeVideoModel(raw)
    case 'inpaint':
      return normalizeInpaintModel(raw)
    case 'embedding':
      return normalizeEmbeddingModel(raw)
    case 'tts':
      return normalizeTtsModel(raw)
    case 'asr':
      return normalizeAsrModel(raw)
    case 'upscale':
      return normalizeUpscaleModel(raw)
    default:
      return normalizeTextModel(raw) // final fallback
  }
}

// ---- Re-exports ----

export { extractBaseFields, toNum, toBool, toStr, toStrArray } from './base'
export { inferTypeFromId, MODEL_ID_TYPE_PATTERNS } from './type-inference'
// TYPE_ALIASES is exported inline above
export { normalizeTextModel } from './text'
export { normalizeImageModel } from './image'
export { normalizeVideoModel } from './video'
export { normalizeInpaintModel } from './inpaint'
export { normalizeEmbeddingModel } from './embedding'
export { normalizeTtsModel } from './tts'
export { normalizeAsrModel } from './asr'
export { normalizeUpscaleModel } from './upscale'
