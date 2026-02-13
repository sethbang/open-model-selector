import type { InpaintModel } from '../../types'
import { extractBaseFields } from './base'

/** Normalize a raw API response object into an InpaintModel. */
export function normalizeInpaintModel(raw: Record<string, unknown>): InpaintModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const pricing = spec?.pricing as Record<string, unknown> | undefined
  const constraints = spec?.constraints as Record<string, unknown> | undefined

  const generation = pricing?.generation as { usd?: number } | undefined

  return {
    ...base,
    type: 'inpaint',
    pricing: {
      generation: generation?.usd,
    },
    constraints: constraints ? {
      aspectRatios: constraints.aspectRatios as string[] | undefined,
      combineImages: constraints.combineImages as boolean | undefined,
    } : undefined,
  }
}
