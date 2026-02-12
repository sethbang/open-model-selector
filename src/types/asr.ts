import type { BaseModel } from './base'

export interface AsrPricing {
  per_audio_second?: number  // USD per second of audio
}

/** An automatic speech recognition (speech-to-text) model with per-second pricing. */
export interface AsrModel extends BaseModel {
  type: 'asr'
  pricing: AsrPricing
}
