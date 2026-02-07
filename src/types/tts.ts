import type { BaseModel } from './base'

export interface TtsPricing {
  input?: number  // per-input-token USD
}

export interface TtsModel extends BaseModel {
  type: 'tts'
  pricing: TtsPricing
  voices?: string[]
}
