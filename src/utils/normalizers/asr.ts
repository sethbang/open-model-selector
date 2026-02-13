import type { AsrModel } from '../../types'
import { extractBaseFields } from './base'

/** Normalize a raw API response object into an AsrModel. */
export function normalizeAsrModel(raw: Record<string, unknown>): AsrModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const specPricing = spec?.pricing as Record<string, unknown> | undefined

  // ASR pricing: spec.pricing.per_audio_second.usd
  const perAudioSecond = specPricing?.per_audio_second as { usd?: number } | undefined

  return {
    ...base,
    type: 'asr',
    pricing: {
      per_audio_second: perAudioSecond?.usd,
    },
  }
}
