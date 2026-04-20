import type { BaseModel } from '../../types'

/** Safely coerce an unknown value to a number. Returns undefined for non-numeric/NaN. */
export function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

/** Strict boolean guard. Returns the value when it is a real boolean, undefined otherwise.
 *  Does not coerce truthy/falsy values — an object like `{ enabled: true }` is rejected. */
export function toBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}

/** Strict string guard. Returns the value when it is a real string, undefined otherwise. */
export function toStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

/** Strict string-array guard. Returns the array when every element is a string, undefined otherwise. */
export function toStrArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  return v.every((x) => typeof x === 'string') ? (v as string[]) : undefined
}

/** Extract shared BaseModel fields from a raw API response object.
 *  Venice nests most metadata under model_spec; other providers use top-level fields.
 *  This helper checks both locations with model_spec taking priority for Venice-specific fields. */
export function extractBaseFields(raw: Record<string, unknown>): Omit<BaseModel, 'type'> {
  const spec = raw.model_spec as Record<string, unknown> | undefined
  const id = (raw.id as string) || (raw.model_id as string) || ''
  if (!id) throw new Error('Model missing required id field')

  const provider = id.includes('/') ? id.split('/')[0] : (raw.owned_by as string) || 'Unknown'

  return {
    id,
    name: toStr(spec?.name) || toStr(raw.name) || id,
    provider,
    created: toNum(raw.created) ?? Math.floor(Date.now() / 1000),
    description: toStr(spec?.description) || toStr(raw.description) || undefined,
    // Venice-specific fields — always nested under model_spec, never top-level
    betaModel: toBool(spec?.betaModel) ?? toBool(raw.betaModel),
    privacy: toPrivacy(spec?.privacy) ?? toPrivacy(raw.privacy),
    offline: toBool(spec?.offline) ?? toBool(raw.offline),
    modelSource: toStr(spec?.modelSource) ?? toStr(raw.modelSource),
    traits: toStrArray(spec?.traits) ?? toStrArray(raw.traits),
    // Deprecation info — lifecycle field, can appear on any model type.
    deprecation: toDeprecation(spec?.deprecation),
    // CLIENT-SIDE OVERLAY: is_favorite is never returned by any API.
    is_favorite: false,
  }
}

function toPrivacy(v: unknown): 'private' | 'anonymized' | undefined {
  return v === 'private' || v === 'anonymized' ? v : undefined
}

function toDeprecation(v: unknown): { date: string } | undefined {
  if (v && typeof v === 'object') {
    const d = (v as { date?: unknown }).date
    if (typeof d === 'string') return { date: d }
  }
  return undefined
}
