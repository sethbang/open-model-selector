import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelTooltip } from './model-tooltip'
import type {
  TextModel,
  ImageModel,
  VideoModel,
  InpaintModel,
  EmbeddingModel,
  TtsModel,
  AsrModel,
  UpscaleModel,
} from '../types'

// --- Test Fixtures ---

const baseFields = {
  id: 'test-model',
  name: 'Test Model',
  provider: 'test-provider',
  created: 1700000000,
  is_favorite: false,
} as const

const textModel: TextModel = {
  ...baseFields,
  type: 'text',
  description: 'A powerful language model',
  context_length: 128000,
  pricing: { prompt: 0.00003, completion: 0.00006 },
  capabilities: {
    supportsVision: true,
    supportsReasoning: true,
    optimizedForCode: true,
    supportsFunctionCalling: true,
  },
}

const textModelMinimal: TextModel = {
  ...baseFields,
  id: 'minimal-text',
  name: 'Minimal Text Model',
  type: 'text',
  context_length: 0,
  pricing: {},
}

const textModelWithCache: TextModel = {
  ...baseFields,
  id: 'cache-text',
  name: 'Cache Text Model',
  type: 'text',
  context_length: 8192,
  pricing: {
    prompt: 0.00003,
    completion: 0.00006,
    cache_input: 0.000015,
    cache_write: 0.00002,
  },
}

const imageModelWithResolutions: ImageModel = {
  ...baseFields,
  id: 'image-res',
  name: 'Image Res Model',
  type: 'image',
  pricing: {
    resolutions: { '1K': 0.18, '2K': 0.24 },
    upscale_2x: 0.05,
    upscale_4x: 0.1,
  },
  constraints: {
    steps: { default: 30, max: 50 },
    aspectRatios: ['16:9', '1:1', '9:16'],
    resolutions: ['720p', '1080p'],
  },
  supportsWebSearch: true,
}

const imageModelFlat: ImageModel = {
  ...baseFields,
  id: 'image-flat',
  name: 'Image Flat Model',
  type: 'image',
  pricing: { generation: 0.04 },
}

const videoModel: VideoModel = {
  ...baseFields,
  id: 'video-gen',
  name: 'Video Gen Model',
  type: 'video',
  constraints: {
    durations: ['5', '10', '30'],
    resolutions: ['720p', '1080p', '4K'],
    aspect_ratios: ['16:9', '9:16'],
    audio: true,
  },
  model_sets: ['standard', 'turbo'],
}

const videoModelMinimal: VideoModel = {
  ...baseFields,
  id: 'video-min',
  name: 'Video Minimal',
  type: 'video',
}

const inpaintModel: InpaintModel = {
  ...baseFields,
  id: 'inpaint-model',
  name: 'Inpaint Model',
  type: 'inpaint',
  pricing: { generation: 0.08 },
  constraints: {
    aspectRatios: ['1:1', '4:3'],
    combineImages: true,
  },
}

const embeddingModel: EmbeddingModel = {
  ...baseFields,
  id: 'embed-model',
  name: 'Embedding Model',
  type: 'embedding',
  pricing: { input: 0.0000001, output: 0.0000001 },
}

const embeddingModelEmpty: EmbeddingModel = {
  ...baseFields,
  id: 'embed-empty',
  name: 'Embedding Empty',
  type: 'embedding',
  pricing: {},
}

const ttsModel: TtsModel = {
  ...baseFields,
  id: 'tts-model',
  name: 'TTS Model',
  type: 'tts',
  pricing: { input: 0.000015 },
  voices: ['alloy', 'echo', 'fable'],
}

const ttsModelNoVoices: TtsModel = {
  ...baseFields,
  id: 'tts-no-voices',
  name: 'TTS No Voices',
  type: 'tts',
  pricing: { input: 0.000015 },
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
  pricing: { generation: 0.04 },
}

// --- Helpers ---

/**
 * Show the tooltip by hovering the trigger and advancing timers.
 * Must be called inside a `vi.useFakeTimers()` context.
 */
async function showTooltip(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByTestId('tooltip-trigger').closest('.oms-tooltip-trigger')!
  await user.hover(trigger)
  // Advance past the 200 ms open delay
  act(() => { vi.advanceTimersByTime(250) })
}

// --- Tests ---

describe('ModelTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  // ----------------------------------------------------------------
  // Basic rendering & hover lifecycle
  // ----------------------------------------------------------------

  describe('Trigger & visibility', () => {
    it('renders children inside a trigger wrapper', () => {
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">Hover me</span>
        </ModelTooltip>,
      )
      expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument()
      expect(screen.getByText('Hover me')).toBeVisible()
    })

    it('does not show tooltip content initially', () => {
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )
      expect(screen.queryByText(textModel.name)).not.toBeInTheDocument()
    })

    it('shows tooltip content after pointer enter + delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText(textModel.name)).toBeVisible()
    })

    it('hides tooltip content after pointer leave + delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.getByText(textModel.name)).toBeVisible()

      const trigger = screen.getByTestId('tooltip-trigger').closest('.oms-tooltip-trigger')!
      await user.unhover(trigger)
      act(() => { vi.advanceTimersByTime(150) })

      expect(screen.queryByText(textModel.name)).not.toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // Deprecation warnings
  // ----------------------------------------------------------------

  describe('Deprecation warnings', () => {
    it('shows "Deprecated" for a past deprecation date', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const deprecated: TextModel = {
        ...textModel,
        deprecation: { date: '2020-01-01' },
      }
      render(
        <ModelTooltip model={deprecated}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText(/Deprecated/)).toBeVisible()
      expect(screen.getByText(/2020-01-01/)).toBeVisible()
    })

    it('shows "Deprecating" for a future deprecation date', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const deprecating: TextModel = {
        ...textModel,
        deprecation: { date: '2099-12-31' },
      }
      render(
        <ModelTooltip model={deprecating}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText(/Deprecating/)).toBeVisible()
      expect(screen.getByText(/2099-12-31/)).toBeVisible()
    })

    it('omits deprecation badge when model has no deprecation field', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.queryByText(/Deprecated|Deprecating/)).not.toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // Shared badges (privacy, beta, offline)
  // ----------------------------------------------------------------

  describe('Shared badges', () => {
    it('shows Private badge when privacy is "private"', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const model: TextModel = { ...textModel, privacy: 'private' }
      render(
        <ModelTooltip model={model}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.getByText('Private')).toBeVisible()
    })

    it('shows Anonymized badge when privacy is "anonymized"', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const model: TextModel = { ...textModel, privacy: 'anonymized' }
      render(
        <ModelTooltip model={model}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.getByText('Anonymized')).toBeVisible()
    })

    it('shows Beta badge when betaModel is true', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const model: TextModel = { ...textModel, betaModel: true }
      render(
        <ModelTooltip model={model}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.getByText('Beta')).toBeVisible()
    })

    it('shows Offline indicator when offline is true', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const model: TextModel = { ...textModel, offline: true }
      render(
        <ModelTooltip model={model}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.getByText('Offline')).toBeVisible()
    })

    it('shows multiple badges simultaneously', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const model: TextModel = { ...textModel, privacy: 'private', betaModel: true, offline: true }
      render(
        <ModelTooltip model={model}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.getByText('Private')).toBeVisible()
      expect(screen.getByText('Beta')).toBeVisible()
      expect(screen.getByText('Offline')).toBeVisible()
    })

    it('shows no badge pills when model has no special flags', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModelMinimal}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.queryByText('Private')).not.toBeInTheDocument()
      expect(screen.queryByText('Anonymized')).not.toBeInTheDocument()
      expect(screen.queryByText('Beta')).not.toBeInTheDocument()
      expect(screen.queryByText('Offline')).not.toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // Text model content
  // ----------------------------------------------------------------

  describe('Text model content', () => {
    it('renders description, capabilities, context length, provider, and pricing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      // Title
      expect(screen.getByText('Test Model')).toBeVisible()
      // Description
      expect(screen.getByText('A powerful language model')).toBeVisible()
      // Capabilities
      expect(screen.getByText('Vision')).toBeVisible()
      expect(screen.getByText('Reasoning')).toBeVisible()
      expect(screen.getByText('Code')).toBeVisible()
      expect(screen.getByText('Functions')).toBeVisible()
      // Context length: 128000 → "128k Context"
      expect(screen.getByText(/128k/)).toBeVisible()
      expect(screen.getByText(/Context/)).toBeVisible()
      // Provider badge
      expect(screen.getByText('test-provider')).toBeVisible()
      // Pricing: prompt=0.00003 → "$30.00 / 1M", completion=0.00006 → "$60.00 / 1M"
      expect(screen.getByText('$30.00 / 1M')).toBeVisible()
      expect(screen.getByText('$60.00 / 1M')).toBeVisible()
    })

    it('renders cache pricing when available', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModelWithCache}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('Cache input:')).toBeVisible()
      expect(screen.getByText('Cache write:')).toBeVisible()
      // cache_input=0.000015 → "$15.00 / 1M"
      expect(screen.getByText('$15.00 / 1M')).toBeVisible()
      // cache_write=0.00002 → "$20.00 / 1M"
      expect(screen.getByText('$20.00 / 1M')).toBeVisible()
    })

    it('omits description when not provided', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModelMinimal}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      // Title should still render
      expect(screen.getByText('Minimal Text Model')).toBeVisible()
      // No description paragraph
      const muted = document.querySelectorAll('.oms-text-xs.oms-muted')
      expect(muted.length).toBe(0)
    })

    it('omits capability pills when capabilities are absent', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModelMinimal}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.queryByText('Vision')).not.toBeInTheDocument()
      expect(screen.queryByText('Reasoning')).not.toBeInTheDocument()
      expect(screen.queryByText('Code')).not.toBeInTheDocument()
      expect(screen.queryByText('Functions')).not.toBeInTheDocument()
    })

    it('omits context length badge when context_length is 0', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModelMinimal}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.queryByText(/Context/)).not.toBeInTheDocument()
    })

    it('renders pricing labels with dash values when pricing fields are undefined', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModelMinimal}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      // pricing: {} is truthy, so the section renders with "—" for undefined fields
      expect(screen.getByText('Input:')).toBeVisible()
      expect(screen.getByText('Output:')).toBeVisible()
      expect(screen.getAllByText('— / 1M').length).toBe(2)
    })
  })

  // ----------------------------------------------------------------
  // Image model content
  // ----------------------------------------------------------------

  describe('Image model content', () => {
    it('renders resolution-based pricing, constraints, and web search', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={imageModelWithResolutions}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      // Provider
      expect(screen.getByText('test-provider')).toBeVisible()
      // Resolution pricing
      expect(screen.getByText('1K:')).toBeVisible()
      expect(screen.getByText('$0.18')).toBeVisible()
      expect(screen.getByText('2K:')).toBeVisible()
      expect(screen.getByText('$0.24')).toBeVisible()
      // Upscale pricing
      expect(screen.getByText('Upscale 2x:')).toBeVisible()
      expect(screen.getByText('$0.05')).toBeVisible()
      expect(screen.getByText('Upscale 4x:')).toBeVisible()
      expect(screen.getByText('$0.10')).toBeVisible()
      // Constraints
      expect(screen.getByText('Steps:')).toBeVisible()
      expect(screen.getByText(/1–50.*default 30/)).toBeVisible()
      expect(screen.getByText('Aspects:')).toBeVisible()
      expect(screen.getByText('16:9, 1:1, 9:16')).toBeVisible()
      expect(screen.getByText('Resolutions:')).toBeVisible()
      expect(screen.getByText('720p, 1080p')).toBeVisible()
      // Web search pill
      expect(screen.getByText('Web Search')).toBeVisible()
    })

    it('renders flat generation pricing when no resolutions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={imageModelFlat}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('Generation:')).toBeVisible()
      expect(screen.getByText('$0.04')).toBeVisible()
      // No web search
      expect(screen.queryByText('Web Search')).not.toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // Video model content
  // ----------------------------------------------------------------

  describe('Video model content', () => {
    it('renders constraints, audio pill, and model sets', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={videoModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      // Provider
      expect(screen.getByText('test-provider')).toBeVisible()
      // Duration constraints: ["5","10","30"] → "5s – 30s"
      expect(screen.getByText('Duration:')).toBeVisible()
      expect(screen.getByText('5s – 30s')).toBeVisible()
      // Resolutions
      expect(screen.getByText('Resolutions:')).toBeVisible()
      expect(screen.getByText('720p, 1080p, 4K')).toBeVisible()
      // Aspect ratios
      expect(screen.getByText('Aspects:')).toBeVisible()
      expect(screen.getByText('16:9, 9:16')).toBeVisible()
      // Audio pill
      expect(screen.getByText('Audio')).toBeVisible()
      // Model sets
      expect(screen.getByText('standard')).toBeVisible()
      expect(screen.getByText('turbo')).toBeVisible()
    })

    it('renders minimal video model with only provider', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={videoModelMinimal}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('Video Minimal')).toBeVisible()
      expect(screen.getByText('test-provider')).toBeVisible()
      expect(screen.queryByText('Duration:')).not.toBeInTheDocument()
      expect(screen.queryByText('Audio')).not.toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // Inpaint model content
  // ----------------------------------------------------------------

  describe('Inpaint model content', () => {
    it('renders price and constraints', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={inpaintModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('test-provider')).toBeVisible()
      expect(screen.getByText('Price:')).toBeVisible()
      expect(screen.getByText('$0.08')).toBeVisible()
      expect(screen.getByText('Aspects:')).toBeVisible()
      expect(screen.getByText('1:1, 4:3')).toBeVisible()
      expect(screen.getByText('Combine:')).toBeVisible()
      expect(screen.getByText('Yes')).toBeVisible()
    })
  })

  // ----------------------------------------------------------------
  // Embedding model content
  // ----------------------------------------------------------------

  describe('Embedding model content', () => {
    it('renders input and output pricing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={embeddingModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('test-provider')).toBeVisible()
      expect(screen.getByText('Input:')).toBeVisible()
      expect(screen.getByText('Output:')).toBeVisible()
    })

    it('omits pricing section when pricing is empty', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={embeddingModelEmpty}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('test-provider')).toBeVisible()
      expect(screen.queryByText('Input:')).not.toBeInTheDocument()
      expect(screen.queryByText('Output:')).not.toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // TTS model content
  // ----------------------------------------------------------------

  describe('TTS model content', () => {
    it('renders pricing and voice count', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={ttsModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('test-provider')).toBeVisible()
      expect(screen.getByText('Price:')).toBeVisible()
      // 3 voices
      expect(screen.getByText('3 voices available')).toBeVisible()
    })

    it('shows singular "voice" for exactly 1 voice', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const singleVoice: TtsModel = { ...ttsModel, voices: ['alloy'] }
      render(
        <ModelTooltip model={singleVoice}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.getByText('1 voice available')).toBeVisible()
    })

    it('omits voice section when voices are absent', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={ttsModelNoVoices}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.queryByText(/voices? available/)).not.toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // ASR model content
  // ----------------------------------------------------------------

  describe('ASR model content', () => {
    it('renders per-audio-second pricing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={asrModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('test-provider')).toBeVisible()
      expect(screen.getByText('Price:')).toBeVisible()
      // 0.006 → "$0.0060 / sec"
      expect(screen.getByText('$0.0060 / sec')).toBeVisible()
    })

    it('omits pricing when per_audio_second is undefined', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const noPricing: AsrModel = { ...asrModel, pricing: {} }
      render(
        <ModelTooltip model={noPricing}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('test-provider')).toBeVisible()
      expect(screen.queryByText('Price:')).not.toBeInTheDocument()
    })
  })

  // ----------------------------------------------------------------
  // Upscale model content
  // ----------------------------------------------------------------

  describe('Upscale model content', () => {
    it('renders generation price', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={upscaleModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      expect(screen.getByText('test-provider')).toBeVisible()
      expect(screen.getByText('Price:')).toBeVisible()
      expect(screen.getByText('$0.04')).toBeVisible()
    })
  })

  // ----------------------------------------------------------------
  // Tooltip content portal
  // ----------------------------------------------------------------

  describe('Portal rendering', () => {
    it('renders tooltip content into document.body via portal', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      // The tooltip content should be a direct child of body (portal)
      const tooltipContent = document.querySelector('.oms-hover-content')
      expect(tooltipContent).toBeTruthy()
      expect(tooltipContent!.parentElement).toBe(document.body)
    })
  })

  // ----------------------------------------------------------------
  // Accessibility (C-1)
  // ----------------------------------------------------------------

  describe('Accessibility', () => {
    it('tooltip content has role="tooltip" and a matching id', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)

      const tooltipContent = document.querySelector('.oms-hover-content')
      expect(tooltipContent).toBeTruthy()
      expect(tooltipContent!.getAttribute('role')).toBe('tooltip')
      expect(tooltipContent!.id).toBeTruthy()
    })

    it('trigger has aria-describedby referencing the tooltip id when visible', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      const trigger = screen.getByTestId('tooltip-trigger').closest('.oms-tooltip-trigger')!

      // Before showing: no aria-describedby
      expect(trigger.getAttribute('aria-describedby')).toBeNull()

      await showTooltip(user)

      // After showing: aria-describedby matches tooltip id
      const tooltipContent = document.querySelector('.oms-hover-content')
      expect(tooltipContent).toBeTruthy()
      expect(trigger.getAttribute('aria-describedby')).toBe(tooltipContent!.id)
    })

    it('trigger has no aria-describedby when tooltip is hidden', () => {
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      const trigger = screen.getByTestId('tooltip-trigger').closest('.oms-tooltip-trigger')!
      expect(trigger.getAttribute('aria-describedby')).toBeNull()
    })

    it('shows tooltip on focus and hides on blur', async () => {
      render(
        <ModelTooltip model={textModel}>
          <button data-testid="tooltip-trigger">focusable trigger</button>
        </ModelTooltip>,
      )

      const button = screen.getByTestId('tooltip-trigger')

      // Focus the button — React's onFocus (focusin) should bubble to the trigger wrapper
      act(() => { button.focus() })
      act(() => { vi.advanceTimersByTime(250) })

      expect(screen.getByText(textModel.name)).toBeVisible()

      // Blur the button
      act(() => { button.blur() })
      act(() => { vi.advanceTimersByTime(150) })

      expect(screen.queryByText(textModel.name)).not.toBeInTheDocument()
    })

    it('hides tooltip when an ancestor scrolls (W-8)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <span data-testid="tooltip-trigger">trigger</span>
        </ModelTooltip>,
      )

      await showTooltip(user)
      expect(screen.getByText(textModel.name)).toBeVisible()

      // Simulate a scroll event (capture phase) from a scrollable container
      act(() => {
        const scrollEvent = new Event('scroll', { bubbles: false })
        document.dispatchEvent(scrollEvent)
      })

      expect(screen.queryByText(textModel.name)).not.toBeInTheDocument()
    })

    it('hides tooltip on Escape key', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(
        <ModelTooltip model={textModel}>
          <button data-testid="tooltip-trigger">focusable trigger</button>
        </ModelTooltip>,
      )

      const button = screen.getByTestId('tooltip-trigger')

      // Show via focus
      act(() => { button.focus() })
      act(() => { vi.advanceTimersByTime(250) })
      expect(screen.getByText(textModel.name)).toBeVisible()

      // Press Escape
      await user.keyboard('{Escape}')

      expect(screen.queryByText(textModel.name)).not.toBeInTheDocument()
    })
  })
})
