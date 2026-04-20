import type { TextModel } from '../../types'
import { extractBaseFields, toNum, toBool, toStr } from './base'

/** Normalize a raw API response object into a TextModel. */
export function normalizeTextModel(raw: Record<string, unknown>): TextModel {
  const base = extractBaseFields(raw)
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const specPricing = spec?.pricing as Record<string, unknown> | undefined

  // Context length: try multiple locations; undefined if none apply.
  const context_length =
    toNum(raw.context_length) ?? toNum(raw.context_window) ?? toNum(spec?.availableContextTokens)

  // Pricing resolution: check multiple locations and shapes
  // 1. raw.pricing (OpenRouter format — already per-token)
  // 2. raw.metadata?.pricing
  // 3. raw.cost
  // 4. spec.pricing (Venice format — per-million-token, needs division by 1,000,000)
  // 5. fallback to empty
  const rawPricing = raw.pricing as Record<string, unknown> | undefined
  const metaPricing = (raw.metadata as Record<string, unknown> | undefined)?.pricing as
    | Record<string, unknown>
    | undefined
  const costPricing = raw.cost as Record<string, unknown> | undefined

  let prompt: number | undefined
  let completion: number | undefined
  let cache_input: number | undefined
  let cache_write: number | undefined

  if (rawPricing) {
    // OpenRouter/OpenAI format — values are per-token already.
    // OpenRouter names cache fields `input_cache_read` / `input_cache_write`;
    // some providers use `cache_input` / `cache_write`. Accept both.
    prompt = toNum(rawPricing.prompt)
    completion = toNum(rawPricing.completion)
    cache_input = toNum(rawPricing.cache_input) ?? toNum(rawPricing.input_cache_read)
    cache_write = toNum(rawPricing.cache_write) ?? toNum(rawPricing.input_cache_write)
  } else if (metaPricing) {
    prompt = toNum(metaPricing.prompt)
    completion = toNum(metaPricing.completion)
  } else if (costPricing) {
    prompt = toNum(costPricing.prompt)
    completion = toNum(costPricing.completion)
  } else if (specPricing) {
    // Venice format: spec.pricing.input.usd / spec.pricing.output.usd (per-million-token)
    const input = specPricing.input as { usd?: number } | undefined
    const output = specPricing.output as { usd?: number } | undefined
    const cacheInput = specPricing.cache_input as { usd?: number } | undefined
    const cacheWrite = specPricing.cache_write as { usd?: number } | undefined
    prompt = input?.usd !== undefined ? input.usd / 1_000_000 : undefined
    completion = output?.usd !== undefined ? output.usd / 1_000_000 : undefined
    cache_input = cacheInput?.usd !== undefined ? cacheInput.usd / 1_000_000 : undefined
    cache_write = cacheWrite?.usd !== undefined ? cacheWrite.usd / 1_000_000 : undefined
  }

  // Capabilities from model_spec.capabilities
  const caps = spec?.capabilities as Record<string, unknown> | undefined

  // Constraints from model_spec.constraints
  const constraints = spec?.constraints as Record<string, unknown> | undefined

  return {
    ...base,
    type: 'text',
    context_length,
    pricing: {
      prompt,
      completion,
      cache_input,
      cache_write,
    },
    capabilities: caps
      ? {
          optimizedForCode: toBool(caps.optimizedForCode),
          supportsVision: toBool(caps.supportsVision),
          supportsMultipleImages: toBool(caps.supportsMultipleImages),
          supportsReasoning: toBool(caps.supportsReasoning),
          supportsFunctionCalling: toBool(caps.supportsFunctionCalling),
          supportsResponseSchema: toBool(caps.supportsResponseSchema),
          supportsLogProbs: toBool(caps.supportsLogProbs),
          supportsAudioInput: toBool(caps.supportsAudioInput),
          supportsVideoInput: toBool(caps.supportsVideoInput),
          supportsWebSearch: toBool(caps.supportsWebSearch),
          quantization: toStr(caps.quantization),
        }
      : undefined,
    constraints: constraints
      ? {
          temperature: constraints.temperature as { default: number } | undefined,
          top_p: constraints.top_p as { default: number } | undefined,
        }
      : undefined,
  }
}
