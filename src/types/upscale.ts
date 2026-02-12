import type { BaseModel } from './base'

export interface UpscalePricing {
  generation?: number  // flat USD per upscale
}

/** An image upscaling model with flat per-generation pricing. */
export interface UpscaleModel extends BaseModel {
  type: 'upscale'
  pricing: UpscalePricing
}
