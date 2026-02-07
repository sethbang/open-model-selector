import type { BaseModel } from './base'

export interface EmbeddingPricing {
  input?: number    // per-token USD
  output?: number   // per-token USD
}

export interface EmbeddingModel extends BaseModel {
  type: 'embedding'
  pricing: EmbeddingPricing
}
