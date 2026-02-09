// Pure utility functions — no "use client" directive
// Import from "open-model-selector/utils" for RSC-safe usage

// Re-export normalizer utilities
export {
  defaultModelNormalizer,
  defaultResponseExtractor,
  extractBaseFields,
  toNum,
  inferTypeFromId,
  MODEL_ID_TYPE_PATTERNS,
  normalizeTextModel,
  normalizeImageModel,
  normalizeVideoModel,
  normalizeInpaintModel,
  normalizeEmbeddingModel,
  normalizeTtsModel,
  normalizeAsrModel,
  normalizeUpscaleModel,
} from './normalizers/index'

export type {
  ModelNormalizer,
  ResponseExtractor,
} from './normalizers/index'

// Re-export helper utilities
export { cn, isDeprecated } from './helpers'

// Re-export format utilities
export {
  formatPrice,
  formatContextLength,
  formatFlatPrice,
  formatAudioPrice,
  formatDuration,
  formatResolutions,
  formatAspectRatios,
} from './format'
