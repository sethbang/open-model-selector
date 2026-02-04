export type { ModelType, BaseModel, Deprecation } from './base'
export type { TextModel, TextPricing, TextCapabilities, TextConstraints } from './text'
export type { ImageModel, ImagePricing, ImageConstraints } from './image'
export type { VideoModel, VideoConstraints } from './video'
export type { InpaintModel, InpaintPricing, InpaintConstraints } from './inpaint'
export type { EmbeddingModel, EmbeddingPricing } from './embedding'
export type { TtsModel, TtsPricing } from './tts'
export type { AsrModel, AsrPricing } from './asr'
export type { UpscaleModel, UpscalePricing } from './upscale'

import type { TextModel } from './text'
import type { ImageModel } from './image'
import type { VideoModel } from './video'
import type { InpaintModel } from './inpaint'
import type { EmbeddingModel } from './embedding'
import type { TtsModel } from './tts'
import type { AsrModel } from './asr'
import type { UpscaleModel } from './upscale'

/** Discriminated union of all supported model types. Use `model.type` to narrow. */
export type AnyModel = TextModel | ImageModel | VideoModel | InpaintModel
  | EmbeddingModel | TtsModel | AsrModel | UpscaleModel
