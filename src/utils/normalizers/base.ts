import type { BaseModel } from '../../types'

/** Safely coerce an unknown value to a number. Returns undefined for non-numeric/NaN. */
export function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

/** Extract shared BaseModel fields from a raw API response object.
 *  Venice nests most metadata under model_spec; other providers use top-level fields.
 *  This helper checks both locations with model_spec taking priority for Venice-specific fields. */
export function extractBaseFields(raw: Record<string, unknown>): Omit<BaseModel, 'type'> {
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const id = (raw.id as string) || (raw.model_id as string) || ''
  if (!id) throw new Error('Model missing required id field')

  const provider = id.includes('/')
    ? id.split('/')[0]
    : (raw.owned_by as string) || 'Unknown'

  return {
    id,
    name: (spec?.name as string) || (raw.name as string) || id,
    provider,
    created: toNum(raw.created) ?? Math.floor(Date.now() / 1000),
    description: (spec?.description as string) || (raw.description as string) || undefined,
    // Venice-specific fields — always nested under model_spec, never top-level
    betaModel: (spec?.betaModel as boolean) ?? (raw.betaModel as boolean) ?? undefined,
    privacy: (spec?.privacy as 'private' | 'anonymized') ?? (raw.privacy as 'private' | 'anonymized') ?? undefined,
    offline: (spec?.offline as boolean) ?? (raw.offline as boolean) ?? undefined,
    modelSource: (spec?.modelSource as string) ?? (raw.modelSource as string) ?? undefined,
    traits: (spec?.traits as string[]) ?? (raw.traits as string[]) ?? undefined,
    // Deprecation info — lifecycle field, can appear on any model type.
    deprecation: (spec?.deprecation as { date: string }) ?? undefined,
    // CLIENT-SIDE OVERLAY: is_favorite is never returned by any API.
    is_favorite: false,
  }
}
