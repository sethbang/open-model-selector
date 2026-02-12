import type { BaseModel } from './base'

export interface TtsPricing {
  input?: number  // per-input-token USD
}

/** A text-to-speech model with pricing and available voice options. */
export interface TtsModel extends BaseModel {
  type: 'tts'
  pricing: TtsPricing
  voices?: string[]
}
