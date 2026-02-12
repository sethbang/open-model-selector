import type { BaseModel } from './base'

export interface EmbeddingPricing {
  input?: number    // per-token USD
  output?: number   // per-token USD
}

/** A text embedding model with per-token pricing. */
export interface EmbeddingModel extends BaseModel {
  type: 'embedding'
  pricing: EmbeddingPricing
}
