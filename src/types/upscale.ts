import type { BaseModel } from './base'

export interface UpscalePricing {
  generation?: number  // flat USD per upscale
}

export interface UpscaleModel extends BaseModel {
  type: 'upscale'
  pricing: UpscalePricing
}
