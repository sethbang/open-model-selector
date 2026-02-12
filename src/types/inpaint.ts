import type { BaseModel } from './base'

export interface InpaintPricing {
  generation?: number  // flat USD per inpaint generation
}

/** Generation constraints for an inpainting model (aspect ratios, image combining). */
export interface InpaintConstraints {
  aspectRatios?: string[]
  combineImages?: boolean
}

/** An image inpainting/editing model with pricing and generation constraints. */
export interface InpaintModel extends BaseModel {
  type: 'inpaint'
  pricing: InpaintPricing
  constraints?: InpaintConstraints
}
