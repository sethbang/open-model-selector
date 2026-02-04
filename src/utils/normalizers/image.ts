import type { ImageModel } from '../../types'
import { extractBaseFields } from './base'

/** Normalize a raw API response object into an ImageModel. */
export function normalizeImageModel(raw: Record<string, unknown>): ImageModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const pricing = spec?.pricing as Record<string, unknown> | undefined
  const constraints = spec?.constraints as Record<string, unknown> | undefined

  // Extract generation pricing — { usd, diem } → number
  const generation = pricing?.generation as { usd?: number } | undefined

  // Extract upscale pricing — nested under pricing.upscale.2x / .4x
  const upscale = pricing?.upscale as Record<string, { usd?: number }> | undefined

  // Extract resolution-based pricing — each entry is { usd, diem }, NOT a flat number.
  // Raw API shape: { "1K": { "usd": 0.18, "diem": 0.18 }, "2K": { ... } }
  // Normalized shape: { "1K": 0.18, "2K": 0.24 }
  const rawResolutions = pricing?.resolutions as Record<string, { usd?: number }> | undefined
  let normalizedResolutions: Record<string, number> | undefined
  if (rawResolutions && typeof rawResolutions === 'object') {
    normalizedResolutions = {}
    for (const [key, value] of Object.entries(rawResolutions)) {
      if (value && typeof value === 'object' && 'usd' in value) {
        normalizedResolutions[key] = value.usd ?? 0
      }
    }
  }

  return {
    ...base,
    type: 'image',
    pricing: {
      generation: generation?.usd,
      upscale_2x: upscale?.['2x']?.usd,
      upscale_4x: upscale?.['4x']?.usd,
      resolutions: normalizedResolutions,
    },
    constraints: constraints ? {
      promptCharacterLimit: constraints.promptCharacterLimit as number | undefined,
      steps: constraints.steps as { default: number; max: number } | undefined,
      widthHeightDivisor: constraints.widthHeightDivisor as number | undefined,
      aspectRatios: constraints.aspectRatios as string[] | undefined,
      defaultAspectRatio: constraints.defaultAspectRatio as string | undefined,
      resolutions: constraints.resolutions as string[] | undefined,
      defaultResolution: constraints.defaultResolution as string | undefined,
    } : undefined,
    // supportsWebSearch lives at model_spec.supportsWebSearch (sibling of constraints),
    // NOT inside model_spec.constraints. Extract from spec, not constraints.
    supportsWebSearch: (spec?.supportsWebSearch as boolean) ?? undefined,
  }
}
