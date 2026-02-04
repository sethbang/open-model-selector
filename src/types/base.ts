/** Union of all supported model type identifiers. */
export type ModelType = 'text' | 'image' | 'video' | 'inpaint' | 'embedding' | 'tts' | 'asr' | 'upscale'

export interface Deprecation {
  /** ISO 8601 date string indicating when the model is/was deprecated */
  date: string
}

export interface BaseModel {
  id: string
  name: string
  provider: string
  created: number
  type: ModelType
  description?: string
  privacy?: 'private' | 'anonymized'
  offline?: boolean
  betaModel?: boolean
  /** Whether the user has marked this model as a favorite.
   *  CLIENT-SIDE OVERLAY — this field is NEVER returned by any API.
   *  It is a UI-layer concern managed via localStorage in the ModelSelector component.
   *  Normalizers MUST default this to `false`; the component hydrates the real value
   *  from localStorage at render time. */
  is_favorite?: boolean
  modelSource?: string
  traits?: string[]
  /** Deprecation info if this model is scheduled for or has been deprecated. */
  deprecation?: Deprecation
}
