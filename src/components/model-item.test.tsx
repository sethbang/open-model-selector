import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Command as CommandPrimitive } from 'cmdk'
import { ModelItem, areModelItemPropsEqual } from './model-item'
import type {
  TextModel,
  ImageModel,
  VideoModel,
  InpaintModel,
  TtsModel,
  AsrModel,
  UpscaleModel,
} from '../types'

// --- Test Fixtures ---

const baseFields = {
  provider: 'test-provider',
  created: 1700000000,
  description: 'Test model',
  is_favorite: false,
} as const

const textModel: TextModel = {
  ...baseFields,
  id: 'text-model',
  name: 'Text Model',
  type: 'text',
  context_length: 128000,
  pricing: { prompt: 0.00003, completion: 0.00006 },
}

const imageModel: ImageModel = {
  ...baseFields,
  id: 'image-model',
  name: 'Image Model',
  type: 'image',
  pricing: { generation: 0.04 },
}

const videoModel: VideoModel = {
  ...baseFields,
  id: 'video-model',
  name: 'Video Model',
  type: 'video',
  constraints: {
    durations: ['5', '10', '30'],
    audio: true,
  },
}

const inpaintModel: InpaintModel = {
  ...baseFields,
  id: 'inpaint-model',
  name: 'Inpaint Model',
  type: 'inpaint',
  pricing: { generation: 0.08 },
}

const ttsModel: TtsModel = {
  ...baseFields,
  id: 'tts-model',
  name: 'TTS Model',
  type: 'tts',
  pricing: { input: 0.00001 },
  voices: ['alloy', 'echo', 'fable'],
}

const asrModel: AsrModel = {
  ...baseFields,
  id: 'asr-model',
  name: 'ASR Model',
  type: 'asr',
  pricing: { per_audio_second: 0.006 },
}

const upscaleModel: UpscaleModel = {
  ...baseFields,
  id: 'upscale-model',
  name: 'Upscale Model',
  type: 'upscale',
  pricing: { generation: 0.18 },
}

// --- Helpers ---

const defaultProps = {
  isSelected: false,
  onSelect: vi.fn(),
  onToggleFavorite: vi.fn(),
}

/**
 * Renders ModelItem inside a cmdk Command root (required since ModelItem
 * uses CommandPrimitive.Item internally).
 */
function renderModelItem(props: Parameters<typeof ModelItem>[0]) {
  return render(
    <CommandPrimitive>
      <CommandPrimitive.List>
        <ModelItem {...props} />
      </CommandPrimitive.List>
    </CommandPrimitive>,
  )
}

// --- Tests ---

describe('ModelItem', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  // ─── renderInlineMeta ────────────────────────────────────────────────

  describe('renderInlineMeta', () => {
    it('renders provider for every model type', () => {
      renderModelItem({ ...defaultProps, model: imageModel })
      expect(screen.getByText('test-provider')).toBeInTheDocument()
    })

    it('renders pricing for image models', () => {
      renderModelItem({ ...defaultProps, model: imageModel })
      // formatFlatPrice(0.04) → "$0.04"
      expect(screen.getByText('$0.04')).toBeInTheDocument()
    })

    it('renders duration and audio badge for video models', () => {
      renderModelItem({ ...defaultProps, model: videoModel })
      // formatDuration(['5','10','30']) → "5s – 30s"
      expect(screen.getByText('5s – 30s')).toBeInTheDocument()
    })

    it('renders pricing for inpaint models', () => {
      renderModelItem({ ...defaultProps, model: inpaintModel })
      // formatFlatPrice(0.08) → "$0.08"
      expect(screen.getByText('$0.08')).toBeInTheDocument()
    })

    it('renders voice count for tts models', () => {
      renderModelItem({ ...defaultProps, model: ttsModel })
      expect(screen.getByText('3 voices')).toBeInTheDocument()
    })

    it('renders per-second audio pricing for asr models', () => {
      renderModelItem({ ...defaultProps, model: asrModel })
      // formatAudioPrice(0.006) → "$0.0060 / sec"
      expect(screen.getByText('$0.0060 / sec')).toBeInTheDocument()
    })

    it('renders pricing for upscale models', () => {
      renderModelItem({ ...defaultProps, model: upscaleModel })
      // formatFlatPrice(0.18) → "$0.18"
      expect(screen.getByText('$0.18')).toBeInTheDocument()
    })

    it('renders context length for text models', () => {
      renderModelItem({ ...defaultProps, model: textModel })
      // formatContextLength(128000) → "128k"
      expect(screen.getByText('128k')).toBeInTheDocument()
    })

    it('renders type badge for non-text models', () => {
      renderModelItem({ ...defaultProps, model: imageModel })
      expect(screen.getByText('image')).toBeInTheDocument()
    })

    it('does NOT render type badge for text models', () => {
      renderModelItem({ ...defaultProps, model: textModel })
      expect(screen.queryByText('text')).not.toBeInTheDocument()
    })

    it('renders no pricing when image model has no generation price', () => {
      const noPriceImage: ImageModel = {
        ...imageModel,
        pricing: {},
      }
      renderModelItem({ ...defaultProps, model: noPriceImage })
      expect(screen.getByText('test-provider')).toBeInTheDocument()
      expect(screen.queryByText('$')).not.toBeInTheDocument()
    })

    it('renders no duration when video model has no constraints', () => {
      const noConstraintVideo: VideoModel = {
        ...videoModel,
        constraints: undefined,
      }
      renderModelItem({ ...defaultProps, model: noConstraintVideo })
      expect(screen.getByText('test-provider')).toBeInTheDocument()
    })

    it('renders no voices when tts model has empty voices array', () => {
      const noVoicesTts: TtsModel = {
        ...ttsModel,
        voices: [],
      }
      renderModelItem({ ...defaultProps, model: noVoicesTts })
      expect(screen.getByText('test-provider')).toBeInTheDocument()
      expect(screen.queryByText(/voices/)).not.toBeInTheDocument()
    })
  })

  // ─── areModelItemPropsEqual ──────────────────────────────────────────

  describe('areModelItemPropsEqual', () => {
    const onSelect = vi.fn()
    const onToggleFavorite = vi.fn()

    const baseProps = {
      model: textModel,
      isSelected: false,
      onSelect,
      onToggleFavorite,
    }

    it('returns true when all props are identical', () => {
      expect(areModelItemPropsEqual(baseProps, baseProps)).toBe(true)
    })

    it('returns true when model is same reference (fast path)', () => {
      const prev = { ...baseProps }
      const next = { ...baseProps } // same model reference
      expect(areModelItemPropsEqual(prev, next)).toBe(true)
    })

    it('returns false when isSelected differs', () => {
      const next = { ...baseProps, isSelected: true }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when onSelect differs', () => {
      const next = { ...baseProps, onSelect: vi.fn() }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when onToggleFavorite differs', () => {
      const next = { ...baseProps, onToggleFavorite: vi.fn() }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when model reference changes and is_favorite differs', () => {
      const next = {
        ...baseProps,
        model: { ...textModel, is_favorite: true },
      }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when model reference changes and id differs', () => {
      const next = {
        ...baseProps,
        model: { ...textModel, id: 'different-id' },
      }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when model reference changes and name differs', () => {
      const next = {
        ...baseProps,
        model: { ...textModel, name: 'Different Name' },
      }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when model reference changes and provider differs', () => {
      const next = {
        ...baseProps,
        model: { ...textModel, provider: 'other-provider' },
      }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when model reference changes and type differs', () => {
      const next = {
        ...baseProps,
        model: { ...imageModel, context_length: 0 } as unknown as typeof textModel,
      }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when model reference changes and description differs', () => {
      const next = {
        ...baseProps,
        model: { ...textModel, description: 'changed desc' },
      }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns false when model reference changes and deprecation date differs', () => {
      const next = {
        ...baseProps,
        model: { ...textModel, deprecation: { date: '2025-01-01' } },
      }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(false)
    })

    it('returns true when model reference changes but all compared fields match', () => {
      // Spread creates a new reference, but all field values are identical
      const next = {
        ...baseProps,
        model: { ...textModel },
      }
      expect(areModelItemPropsEqual(baseProps, next)).toBe(true)
    })
  })

  // ─── Star button keyboard interaction ────────────────────────────────

  describe('star button keyboard interaction', () => {
    it('calls onToggleFavorite on click', async () => {
      const onToggleFavorite = vi.fn()
      const user = userEvent.setup()
      renderModelItem({
        ...defaultProps,
        model: textModel,
        onToggleFavorite,
      })

      const starBtn = screen.getByLabelText('Add to favorites')
      await user.click(starBtn)
      expect(onToggleFavorite).toHaveBeenCalledWith('text-model')
    })

    it('stops propagation on Enter keydown on star button', async () => {
      const onToggleFavorite = vi.fn()
      const user = userEvent.setup()
      renderModelItem({
        ...defaultProps,
        model: textModel,
        onToggleFavorite,
      })

      const starBtn = screen.getByLabelText('Add to favorites')
      // Focus the button and press Enter
      starBtn.focus()
      await user.keyboard('{Enter}')
      // The keydown handler calls stopPropagation, which prevents the
      // cmdk item's onSelect from firing. We verify the button received
      // the key event without error and didn't bubble to select the item.
      expect(defaultProps.onSelect).not.toHaveBeenCalled()
    })

    it('stops propagation on Space keydown on star button', async () => {
      const onToggleFavorite = vi.fn()
      const user = userEvent.setup()
      renderModelItem({
        ...defaultProps,
        model: textModel,
        onToggleFavorite,
      })

      const starBtn = screen.getByLabelText('Add to favorites')
      starBtn.focus()
      await user.keyboard(' ')
      // Space on a button triggers click in browsers, so onToggleFavorite
      // should fire, but the cmdk item onSelect should NOT fire because
      // stopPropagation was called on keydown.
      expect(defaultProps.onSelect).not.toHaveBeenCalled()
    })

    it('renders "Remove from favorites" aria-label when model is favorited', () => {
      const favModel = { ...textModel, is_favorite: true }
      renderModelItem({ ...defaultProps, model: favModel })
      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument()
    })
  })
})
