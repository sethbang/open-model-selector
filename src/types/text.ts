import type { BaseModel } from './base'

export interface TextPricing {
  prompt?: number        // per-token USD
  completion?: number    // per-token USD
  cache_input?: number   // per-token USD (cached prompt)
  cache_write?: number   // per-token USD (cache write)
}

export interface TextCapabilities {
  optimizedForCode?: boolean
  supportsVision?: boolean
  supportsReasoning?: boolean
  supportsFunctionCalling?: boolean
  supportsResponseSchema?: boolean
  supportsLogProbs?: boolean
  supportsAudioInput?: boolean
  supportsVideoInput?: boolean
  supportsWebSearch?: boolean
  quantization?: string  // fp4, fp8, fp16, int4, not-available
}

export interface TextConstraints {
  temperature?: { default: number }
  top_p?: { default: number }
}

export interface TextModel extends BaseModel {
  type: 'text'
  context_length: number
  pricing: TextPricing
  capabilities?: TextCapabilities
  constraints?: TextConstraints
}
