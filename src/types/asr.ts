import type { BaseModel } from './base'

export interface AsrPricing {
  per_audio_second?: number  // USD per second of audio
}

export interface AsrModel extends BaseModel {
  type: 'asr'
  pricing: AsrPricing
}
