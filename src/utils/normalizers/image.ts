import type { ImageModel } from '../../types'
import { extractBaseFields, toBool, toNum, toStr, toStrArray } from './base'

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
    constraints: constraints
      ? {
          promptCharacterLimit: toNum(constraints.promptCharacterLimit),
          // `steps` is a small structured object; keep the cast but wrap in a runtime guard.
          steps: isStepsShape(constraints.steps) ? constraints.steps : undefined,
          widthHeightDivisor: toNum(constraints.widthHeightDivisor),
          aspectRatios: toStrArray(constraints.aspectRatios),
          defaultAspectRatio: toStr(constraints.defaultAspectRatio),
          resolutions: toStrArray(constraints.resolutions),
          defaultResolution: toStr(constraints.defaultResolution),
        }
      : undefined,
    // supportsWebSearch lives at model_spec.supportsWebSearch (sibling of constraints),
    // NOT inside model_spec.constraints. Extract from spec, not constraints.
    supportsWebSearch: toBool(spec?.supportsWebSearch),
  }
}

function isStepsShape(v: unknown): v is { default: number; max: number } {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { default?: unknown }).default === 'number' &&
    typeof (v as { max?: unknown }).max === 'number'
  )
}
