import type { EmbeddingModel } from '../../types'
import { extractBaseFields } from './base'

/** Normalize a raw API response object into an EmbeddingModel.
 *  Note: Venice embedding models have BOTH input and output pricing. */
export function normalizeEmbeddingModel(raw: Record<string, unknown>): EmbeddingModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const specPricing = spec?.pricing as Record<string, unknown> | undefined

  // Venice format: spec.pricing.input.usd / spec.pricing.output.usd (per-million-token)
  const input = specPricing?.input as { usd?: number } | undefined
  const output = specPricing?.output as { usd?: number } | undefined

  return {
    ...base,
    type: 'embedding',
    pricing: {
      input: input?.usd !== undefined ? input.usd / 1_000_000 : undefined,
      output: output?.usd !== undefined ? output.usd / 1_000_000 : undefined,
    },
  }
}
