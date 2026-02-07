import type { BaseModel } from './base'

export interface VideoConstraints {
  model_type?: 'text-to-video' | 'image-to-video' | 'video'
  aspect_ratios?: string[]
  resolutions?: string[]
  durations?: string[]
  audio?: boolean
  audio_configurable?: boolean
  audio_input?: boolean
  video_input?: boolean
}

// Note: No VideoPricing interface — the Venice API provides no pricing data for video models.
export interface VideoModel extends BaseModel {
  type: 'video'
  constraints?: VideoConstraints
  model_sets?: string[]
}
