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
export type ResponseExtractor = (body: Record<string, unknown> | unknown[]) => Record<string, unknown>[]

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

const VALID_TYPES = new Set<string>(['text', 'image', 'video', 'inpaint', 'embedding', 'tts', 'asr', 'upscale'])

/** Default dispatching model normalizer.
 *  Uses three-tier type resolution:
 *  1. Explicit `raw.type` field (Venice, custom providers)
 *  2. Heuristic inference from model ID patterns (OpenAI, OpenRouter, etc.)
 *  3. Fallback to 'text' — safe default for most providers */
export function defaultModelNormalizer(raw: Record<string, unknown>): AnyModel {
  const id = (raw.id as string) ?? (raw.model_id as string) ?? ''

  // 1. Explicit type from provider (Venice)
  // 2. Heuristic from model ID patterns (OpenAI, OpenRouter, etc.)
  // 3. Default to 'text'
  const rawType = raw.type as string | undefined
  const type: ModelType =
    (rawType && VALID_TYPES.has(rawType) ? rawType as ModelType : undefined) ??
    inferTypeFromId(id) ??
    'text'

  switch (type) {
    case 'text':      return normalizeTextModel(raw)
    case 'image':     return normalizeImageModel(raw)
    case 'video':     return normalizeVideoModel(raw)
    case 'inpaint':   return normalizeInpaintModel(raw)
    case 'embedding': return normalizeEmbeddingModel(raw)
    case 'tts':       return normalizeTtsModel(raw)
    case 'asr':       return normalizeAsrModel(raw)
    case 'upscale':   return normalizeUpscaleModel(raw)
    default:          return normalizeTextModel(raw) // final fallback
  }
}

// ---- Re-exports ----

export { extractBaseFields, toNum } from './base'
export { inferTypeFromId, MODEL_ID_TYPE_PATTERNS } from './type-inference'
export { normalizeTextModel } from './text'
export { normalizeImageModel } from './image'
export { normalizeVideoModel } from './video'
export { normalizeInpaintModel } from './inpaint'
export { normalizeEmbeddingModel } from './embedding'
export { normalizeTtsModel } from './tts'
export { normalizeAsrModel } from './asr'
export { normalizeUpscaleModel } from './upscale'
