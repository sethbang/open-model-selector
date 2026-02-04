// Component exports
export { ModelSelector, SYSTEM_DEFAULT_VALUE } from "./components/model-selector";
export { TextModelSelector } from "./components/text-model-selector";
export { ImageModelSelector } from "./components/image-model-selector";
export { VideoModelSelector } from "./components/video-model-selector";

// Type-specific selector prop types
import type { ModelSelectorProps } from "./components/model-selector";
export type { ModelSelectorProps };

/** Props for TextModelSelector — same as ModelSelectorProps but without `type`. */
export type TextModelSelectorProps = Omit<ModelSelectorProps, 'type'>

/** Props for ImageModelSelector — same as ModelSelectorProps but without `type`. */
export type ImageModelSelectorProps = Omit<ModelSelectorProps, 'type'>

/** Props for VideoModelSelector — same as ModelSelectorProps but without `type`. */
export type VideoModelSelectorProps = Omit<ModelSelectorProps, 'type'>

// Hook exports
export { useModels } from "./hooks/use-models";
export type { UseModelsProps, UseModelsResult, FetchFn } from "./hooks/use-models";

// Type exports
export type {
  ModelType, BaseModel, Deprecation, AnyModel,
  TextModel, TextPricing, TextCapabilities, TextConstraints,
  ImageModel, ImagePricing, ImageConstraints,
  VideoModel, VideoConstraints,
  InpaintModel, InpaintPricing, InpaintConstraints,
  EmbeddingModel, EmbeddingPricing,
  TtsModel, TtsPricing,
  AsrModel, AsrPricing,
  UpscaleModel, UpscalePricing,
} from "./types";

// Normalizer utilities
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
} from "./utils/normalizers/index";

export type {
  ModelNormalizer,
  ResponseExtractor,
} from "./utils/normalizers/index";

// Helper utilities
export { isDeprecated } from "./utils/helpers";

// Format utilities
export {
  formatPrice,
  formatContextLength,
  formatFlatPrice,
  formatAudioPrice,
  formatDuration,
  formatResolutions,
  formatAspectRatios,
} from "./utils/format";
