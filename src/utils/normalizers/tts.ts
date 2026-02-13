import type { TtsModel } from '../../types'
import { extractBaseFields } from './base'

/** Normalize a raw API response object into a TtsModel. */
export function normalizeTtsModel(raw: Record<string, unknown>): TtsModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const specPricing = spec?.pricing as Record<string, unknown> | undefined

  // TTS pricing: spec.pricing.input.usd (per-million-token)
  const input = specPricing?.input as { usd?: number } | undefined

  return {
    ...base,
    type: 'tts',
    pricing: {
      input: input?.usd !== undefined ? input.usd / 1_000_000 : undefined,
    },
    voices: (spec?.voices as string[]) ?? undefined,
  }
}
