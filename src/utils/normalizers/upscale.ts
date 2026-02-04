import type { UpscaleModel } from '../../types'
import { extractBaseFields } from './base'

/** Normalize a raw API response object into an UpscaleModel. */
export function normalizeUpscaleModel(raw: Record<string, unknown>): UpscaleModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const pricing = spec?.pricing as Record<string, unknown> | undefined

  const generation = pricing?.generation as { usd?: number } | undefined

  return {
    ...base,
    type: 'upscale',
    pricing: {
      generation: generation?.usd,
    },
  }
}
