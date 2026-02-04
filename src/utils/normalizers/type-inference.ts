import type { ModelType } from '../../types'

/** Known model ID patterns for heuristic type inference.
 *  Used when the API response lacks an explicit `type` field (non-Venice providers).
 *  Exported so consumers can inspect or extend. */
export const MODEL_ID_TYPE_PATTERNS: Array<[RegExp, ModelType]> = [
  [/\b(embed|embedding)\b/i, 'embedding'],
  [/\b(dall-e|stable-diffusion|sdxl|midjourney|flux)\b/i, 'image'],
  [/\b(tts)\b/i, 'tts'],
  [/\b(whisper|asr)\b/i, 'asr'],
  [/\b(sora|video|wan)\b/i, 'video'],
  [/\b(inpaint)\b/i, 'inpaint'],
  [/\b(upscale|esrgan)\b/i, 'upscale'],
]

/** Infer model type from its ID using naming conventions.
 *  Returns undefined if no pattern matches (caller should fall back to 'text'). */
export function inferTypeFromId(id: string): ModelType | undefined {
  for (const [pattern, type] of MODEL_ID_TYPE_PATTERNS) {
    if (pattern.test(id)) return type
  }
  return undefined
}
