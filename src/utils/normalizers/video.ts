import type { VideoModel } from '../../types'
import { extractBaseFields, toBool, toStr, toStrArray } from './base'

type VideoModelType = 'text-to-video' | 'image-to-video' | 'video'
const VIDEO_MODEL_TYPES = new Set<string>(['text-to-video', 'image-to-video', 'video'])
function toVideoModelType(v: unknown): VideoModelType | undefined {
  const s = toStr(v)
  return s && VIDEO_MODEL_TYPES.has(s) ? (s as VideoModelType) : undefined
}

/** Normalize a raw API response object into a VideoModel.
 *  Note: Video models have NO pricing data from the Venice API. */
export function normalizeVideoModel(raw: Record<string, unknown>): VideoModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const constraints = spec?.constraints as Record<string, unknown> | undefined

  return {
    ...base,
    type: 'video',
    constraints: constraints
      ? {
          model_type: toVideoModelType(constraints.model_type),
          aspect_ratios: toStrArray(constraints.aspect_ratios),
          resolutions: toStrArray(constraints.resolutions),
          durations: toStrArray(constraints.durations),
          audio: toBool(constraints.audio),
          audio_configurable: toBool(constraints.audio_configurable),
          audio_input: toBool(constraints.audio_input),
          video_input: toBool(constraints.video_input),
        }
      : undefined,
    model_sets: toStrArray(spec?.model_sets) ?? toStrArray(raw.model_sets),
  }
}
