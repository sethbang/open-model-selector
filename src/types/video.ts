import type { BaseModel } from './base'

/** Generation constraints for a video model (aspect ratios, durations, audio support, etc.). */
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

/** A video generation model. Note: no pricing data — the Venice API omits it for video models. */
export interface VideoModel extends BaseModel {
  type: 'video'
  constraints?: VideoConstraints
  model_sets?: string[]
}
