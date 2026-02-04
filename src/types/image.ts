import type { BaseModel } from './base'

export interface ImagePricing {
  generation?: number      // flat USD per generation
  upscale_2x?: number
  upscale_4x?: number
  resolutions?: Record<string, number>  // normalized USD values, e.g. { "1K": 0.18, "2K": 0.24 }
}

/** Generation constraints for an image model (prompt limits, aspect ratios, resolutions, etc.). */
export interface ImageConstraints {
  promptCharacterLimit?: number
  steps?: { default: number; max: number }
  widthHeightDivisor?: number
  aspectRatios?: string[]
  defaultAspectRatio?: string
  resolutions?: string[]
  defaultResolution?: string
}

export interface ImageModel extends BaseModel {
  type: 'image'
  pricing: ImagePricing
  constraints?: ImageConstraints
  /** Whether web search is supported for this image model.
   *  In the Venice API, this field lives at `model_spec.supportsWebSearch`
   *  (a sibling of `model_spec.constraints`), NOT inside `model_spec.constraints`. */
  supportsWebSearch?: boolean
}
