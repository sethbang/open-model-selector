import type { VideoModel } from '../../types'
import { extractBaseFields } from './base'

/** Normalize a raw API response object into a VideoModel.
 *  Note: Video models have NO pricing data from the Venice API. */
export function normalizeVideoModel(raw: Record<string, unknown>): VideoModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const constraints = spec?.constraints as Record<string, unknown> | undefined

  return {
    ...base,
    type: 'video',
    constraints: constraints ? {
      model_type: constraints.model_type as 'text-to-video' | 'image-to-video' | 'video' | undefined,
      aspect_ratios: constraints.aspect_ratios as string[] | undefined,
      resolutions: constraints.resolutions as string[] | undefined,
      durations: constraints.durations as string[] | undefined,
      audio: constraints.audio as boolean | undefined,
      audio_configurable: constraints.audio_configurable as boolean | undefined,
      audio_input: constraints.audio_input as boolean | undefined,
      video_input: constraints.video_input as boolean | undefined,
    } : undefined,
    model_sets: (spec?.model_sets as string[]) ?? (raw.model_sets as string[]) ?? undefined,
  }
}
