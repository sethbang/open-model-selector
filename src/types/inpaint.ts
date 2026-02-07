import type { BaseModel } from './base'

export interface InpaintPricing {
  generation?: number  // flat USD per inpaint generation
}

export interface InpaintConstraints {
  aspectRatios?: string[]
  combineImages?: boolean
}

export interface InpaintModel extends BaseModel {
  type: 'inpaint'
  pricing: InpaintPricing
  constraints?: InpaintConstraints
}
