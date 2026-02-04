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
export { isDeprecated } from './helpers'

// Re-export model types for normalizer consumers
export type {
  ModelType,
  BaseModel,
  Deprecation,
  AnyModel,
  TextModel,
  TextPricing,
  TextCapabilities,
  TextConstraints,
  ImageModel,
  ImagePricing,
  ImageConstraints,
  VideoModel,
  VideoConstraints,
  InpaintModel,
  InpaintPricing,
  InpaintConstraints,
  EmbeddingModel,
  EmbeddingPricing,
  TtsModel,
  TtsPricing,
  AsrModel,
  AsrPricing,
  UpscaleModel,
  UpscalePricing,
} from '../types'

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
