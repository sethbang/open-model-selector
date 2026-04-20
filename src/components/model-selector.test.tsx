import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import userEvent from '@testing-library/user-event'
import { ModelSelector, SYSTEM_DEFAULT_VALUE } from './model-selector'
import type { TextModel, ImageModel, AnyModel } from '../types'

// --- Test Fixtures ---

const mockModels: TextModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    created: 1700000000,
    type: 'text',
    description: 'Most capable model',
    context_length: 8192,
    pricing: { prompt: 0.00003, completion: 0.00006 },
    is_favorite: false,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    created: 1710000000,
    type: 'text',
    description: 'Anthropic flagship',
    context_length: 200000,
    pricing: { prompt: 0.000015, completion: 0.000075 },
    is_favorite: false,
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    provider: 'meta',
    created: 1705000000,
    type: 'text',
    context_length: 8192,
    pricing: {},
    is_favorite: false,
  },
]

const mockModelsWithFavorite: TextModel[] = [
  { ...mockModels[0], is_favorite: true },
  mockModels[1],
  mockModels[2],
]

// --- Helpers ---

function createFetchMock(models: TextModel[], delay = 0) {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay))
    if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    return new Response(JSON.stringify({ data: models }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
}

function createFailingFetchMock(status = 500, statusText = 'Internal Server Error') {
  return vi.fn(async () => {
    return new Response('', { status, statusText })
  })
}

// --- Tests ---

describe('ModelSelector', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default placeholder text', () => {
      render(<ModelSelector models={mockModels} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveTextContent('Select model...')
    })

    it('renders with custom placeholder', () => {
      render(<ModelSelector models={mockModels} placeholder="Pick a model" />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveTextContent('Pick a model')
    })

    it('displays selected model name when value is provided', () => {
      render(<ModelSelector models={mockModels} value="gpt-4" onChange={vi.fn()} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveTextContent('GPT-4')
      expect(trigger).toHaveTextContent('openai')
    })

    it('displays "Use System Default" when value is system_default', () => {
      render(<ModelSelector models={mockModels} value={SYSTEM_DEFAULT_VALUE} onChange={vi.fn()} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveTextContent('Use System Default')
    })

    it('shows placeholder when value does not match any model', () => {
      render(<ModelSelector models={mockModels} value="nonexistent" onChange={vi.fn()} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveTextContent('Select model...')
    })

    it('applies custom className to root element', () => {
      const { container } = render(
        <ModelSelector models={mockModels} className="my-custom-class" />,
      )
      expect(container.firstElementChild).toHaveClass('oms-reset', 'my-custom-class')
    })

    it('forwards ref to root element', () => {
      const ref = vi.fn()
      render(<ModelSelector ref={ref} models={mockModels} />)
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })
  })

  describe('Controlled Mode (static models)', () => {
    it('opens popover and displays all models when clicked', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      // All models should be visible in the popover
      expect(screen.getByText('GPT-4')).toBeInTheDocument()
      expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument()
      expect(screen.getByText('Llama 3 70B')).toBeInTheDocument()
    })

    it('calls onChange with model id when a model is selected', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={onChange} />)

      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Claude 3 Opus'))

      expect(onChange).toHaveBeenCalledWith(
        'claude-3-opus',
        expect.objectContaining({
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          provider: 'anthropic',
          type: 'text',
        }),
      )
    })

    it('calls onChange with SYSTEM_DEFAULT_VALUE and null model when system default is selected', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={onChange} showSystemDefault />)

      await user.click(screen.getByRole('combobox'))

      // Find all "Use System Default" texts — one in trigger, one in popover list
      const systemDefaultOptions = screen.getAllByText('Use System Default')
      // Click the last one (the one in the popover list)
      await user.click(systemDefaultOptions[systemDefaultOptions.length - 1])

      expect(onChange).toHaveBeenCalledWith(SYSTEM_DEFAULT_VALUE, null)
    })

    it('hides system default option when showSystemDefault is false', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} showSystemDefault={false} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      // "Use System Default" should not appear anywhere (trigger shows placeholder, not system default)
      const allText = screen.queryAllByText('Use System Default')
      expect(allText.length).toBe(0)
    })

    it('closes popover after selection', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))
      expect(screen.getByText('GPT-4')).toBeInTheDocument()

      await user.click(screen.getByText('GPT-4'))

      // Popover should close
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })

  describe('Managed Mode (API fetch)', () => {
    it('fetches models from baseUrl and displays them', async () => {
      const fetcher = createFetchMock(mockModels)
      const user = userEvent.setup()

      render(
        <ModelSelector baseUrl="https://api.example.com/v1" fetcher={fetcher} onChange={vi.fn()} />,
      )

      // Wait for fetch to complete (useModels appends no query string by default)
      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledWith(
          'https://api.example.com/v1/models',
          expect.objectContaining({
            headers: {},
            signal: expect.any(AbortSignal),
          }),
        )
      })

      // Open the popover and verify models are displayed
      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
      })
    })

    it('sends Authorization header when apiKey is provided', async () => {
      const fetcher = createFetchMock(mockModels)

      render(
        <ModelSelector
          baseUrl="https://api.example.com/v1"
          apiKey="sk-test-key"
          fetcher={fetcher}
          onChange={vi.fn()}
        />,
      )

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: 'Bearer sk-test-key' },
          }),
        )
      })
    })

    it('displays error message when fetch fails', async () => {
      const fetcher = createFailingFetchMock(500, 'Internal Server Error')
      const user = userEvent.setup()

      render(
        <ModelSelector baseUrl="https://api.example.com/v1" fetcher={fetcher} onChange={vi.fn()} />,
      )

      // Wait for fetch to fail
      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveTextContent('500')
      })
    })

    it('disables fetch when static models are provided', async () => {
      const fetcher = createFetchMock(mockModels)

      render(
        <ModelSelector
          models={mockModels}
          baseUrl="https://api.example.com/v1"
          fetcher={fetcher}
          onChange={vi.fn()}
        />,
      )

      // Fetcher should NOT be called when models are provided
      await new Promise((r) => setTimeout(r, 100))
      expect(fetcher).not.toHaveBeenCalled()
    })
  })

  describe('Favorites', () => {
    it('displays favorite models in a separate "Favorites" group', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModelsWithFavorite} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('Favorites')).toBeInTheDocument()
    })

    it('toggles favorite via star button and persists to localStorage', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} storageKey="test-favorites" />)

      await user.click(screen.getByRole('combobox'))

      // Find the star buttons for adding to favorites
      // Models are sorted alphabetically: Claude 3 Opus, GPT-4, Llama 3 70B
      const starButtons = screen.getAllByLabelText('Add to favorites')
      expect(starButtons.length).toBeGreaterThan(0)

      // Click the first star button (Claude 3 Opus, first alphabetically)
      await user.click(starButtons[0])

      // Check localStorage was updated
      const stored = localStorage.getItem('test-favorites')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      // First model alphabetically is claude-3-opus
      expect(parsed).toContain('claude-3-opus')
    })

    it('calls onToggleFavorite in controlled favorites mode', async () => {
      const onToggleFavorite = vi.fn()
      const user = userEvent.setup()
      render(
        <ModelSelector
          models={mockModels}
          onChange={vi.fn()}
          onToggleFavorite={onToggleFavorite}
        />,
      )

      await user.click(screen.getByRole('combobox'))

      // Models sorted alphabetically: Claude 3 Opus is first
      const starButtons = screen.getAllByLabelText('Add to favorites')
      await user.click(starButtons[0])

      expect(onToggleFavorite).toHaveBeenCalledWith('claude-3-opus')
    })

    it('loads favorites from localStorage on mount', async () => {
      localStorage.setItem('test-favorites', JSON.stringify(['gpt-4']))
      const user = userEvent.setup()

      render(<ModelSelector models={mockModels} onChange={vi.fn()} storageKey="test-favorites" />)

      await user.click(screen.getByRole('combobox'))

      // Should show Favorites group since gpt-4 is favorited
      await waitFor(() => {
        expect(screen.getByText('Favorites')).toBeInTheDocument()
      })
    })
  })

  describe('Sorting', () => {
    it('sorts models by name (A-Z) by default', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      // Models should be in alphabetical order: Claude 3 Opus, GPT-4, Llama 3 70B
      const modelNames = screen.getAllByText(/^(Claude 3 Opus|GPT-4|Llama 3 70B)$/)
      expect(modelNames[0]).toHaveTextContent('Claude 3 Opus')
      expect(modelNames[1]).toHaveTextContent('GPT-4')
      expect(modelNames[2]).toHaveTextContent('Llama 3 70B')
    })

    it('calls onSortChange when sort is controlled', async () => {
      const onSortChange = vi.fn()
      const user = userEvent.setup()
      render(
        <ModelSelector
          models={mockModels}
          onChange={vi.fn()}
          sortOrder="name"
          onSortChange={onSortChange}
        />,
      )

      await user.click(screen.getByRole('combobox'))

      // Sort button label describes current state; aria-pressed reflects whether
      // we're in the "newest" (pressed) state.
      const sortButton = screen.getByLabelText('Sort: name (A–Z)')
      expect(sortButton).toHaveAttribute('aria-pressed', 'false')
      await user.click(sortButton)

      expect(onSortChange).toHaveBeenCalledWith('created')
    })

    it('sort button reflects current state via aria-label and aria-pressed', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))

      // Default is "name" — label describes name sort, aria-pressed false.
      let sortButton = screen.getByLabelText('Sort: name (A–Z)')
      expect(sortButton).toHaveAttribute('aria-pressed', 'false')

      await user.click(sortButton)
      // Flipped to "created" — label and aria-pressed both update.
      sortButton = screen.getByLabelText('Sort: newest first')
      expect(sortButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Search', () => {
    it('filters models by search input', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      const searchInput = screen.getByPlaceholderText('Search models...')
      await user.type(searchInput, 'claude')

      // Claude should still be visible
      expect(screen.getByText('Claude 3 Opus')).toBeVisible()
    })

    it('shows "No model found." when search has no results', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      const searchInput = screen.getByPlaceholderText('Search models...')
      await user.type(searchInput, 'zzzznonexistent')

      await waitFor(() => {
        expect(screen.getByText('No model found.')).toBeVisible()
      })
    })
  })

  describe('Accessibility', () => {
    it('has combobox role with proper aria attributes', () => {
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
      expect(trigger).toHaveAttribute('aria-controls')
    })

    it('sets aria-expanded to true when open', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('has proper aria-label for selected model', () => {
      render(<ModelSelector models={mockModels} value="gpt-4" onChange={vi.fn()} />)

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-label', 'Model selector, GPT-4')
    })

    it('has proper aria-label for system default', () => {
      render(<ModelSelector models={mockModels} value={SYSTEM_DEFAULT_VALUE} onChange={vi.fn()} />)

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-label', 'Model selector, Use System Default')
    })

    it('favorite buttons have descriptive aria-labels', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModelsWithFavorite} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument()
      expect(screen.getAllByLabelText('Add to favorites').length).toBeGreaterThan(0)
    })
  })

  describe('Disabled', () => {
    it('sets the disabled attribute on the trigger button', () => {
      render(<ModelSelector models={mockModels} disabled onChange={vi.fn()} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeDisabled()
    })

    it('applies the oms-disabled CSS class to the trigger button', () => {
      render(<ModelSelector models={mockModels} disabled onChange={vi.fn()} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('oms-disabled')
    })

    it('does not open the popover when clicked', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} disabled onChange={vi.fn()} />)

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByPlaceholderText('Search models...')).not.toBeInTheDocument()
    })

    it('has aria-expanded set to false when disabled', () => {
      render(<ModelSelector models={mockModels} disabled onChange={vi.fn()} />)
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('showDeprecated and sortOrder', () => {
    // A date safely in the past for deprecated models
    const PAST_DATE = '2020-01-01T00:00:00Z'
    // A date safely in the future for models scheduled for deprecation
    const FUTURE_DATE = '2099-01-01T00:00:00Z'

    const deprecatedModel: TextModel = {
      id: 'old-model',
      name: 'Old Model',
      provider: 'test',
      created: 1690000000,
      type: 'text',
      context_length: 4096,
      pricing: {},
      is_favorite: false,
      deprecation: { date: PAST_DATE },
    }

    const activeModel: TextModel = {
      id: 'active-model',
      name: 'Active Model',
      provider: 'test',
      created: 1720000000,
      type: 'text',
      context_length: 8192,
      pricing: {},
      is_favorite: false,
    }

    const futureDeprecatedModel: TextModel = {
      id: 'future-deprecated',
      name: 'Future Deprecated',
      provider: 'test',
      created: 1715000000,
      type: 'text',
      context_length: 8192,
      pricing: {},
      is_favorite: false,
      deprecation: { date: FUTURE_DATE },
    }

    it('hides deprecated models when showDeprecated is false', async () => {
      const user = userEvent.setup()
      render(
        <ModelSelector
          models={[activeModel, deprecatedModel]}
          showDeprecated={false}
          onChange={vi.fn()}
        />,
      )

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('Active Model')).toBeInTheDocument()
      expect(screen.queryByText('Old Model')).not.toBeInTheDocument()
    })

    it('still shows future-deprecated models when showDeprecated is false', async () => {
      const user = userEvent.setup()
      render(
        <ModelSelector
          models={[activeModel, futureDeprecatedModel, deprecatedModel]}
          showDeprecated={false}
          onChange={vi.fn()}
        />,
      )

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('Active Model')).toBeInTheDocument()
      expect(screen.getByText('Future Deprecated')).toBeInTheDocument()
      expect(screen.queryByText('Old Model')).not.toBeInTheDocument()
    })

    it('shows deprecated models when showDeprecated is true (default)', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={[activeModel, deprecatedModel]} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('Active Model')).toBeInTheDocument()
      expect(screen.getByText('Old Model')).toBeInTheDocument()
    })

    it('sorts models by creation date (newest first) when sortOrder is "created"', async () => {
      const user = userEvent.setup()
      // Use existing mockModels with known created timestamps:
      // claude-3-opus: 1710000000, llama-3-70b: 1705000000, gpt-4: 1700000000
      render(<ModelSelector models={mockModels} sortOrder="created" onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      const modelNames = screen.getAllByText(/^(Claude 3 Opus|GPT-4|Llama 3 70B)$/)
      expect(modelNames[0]).toHaveTextContent('Claude 3 Opus') // newest: 1710000000
      expect(modelNames[1]).toHaveTextContent('Llama 3 70B') // middle: 1705000000
      expect(modelNames[2]).toHaveTextContent('GPT-4') // oldest: 1700000000
    })

    it('places deprecated models at the end of the sorted list', async () => {
      const user = userEvent.setup()
      // deprecatedModel has the earliest created timestamp but should still appear last
      // due to its past deprecation date, regardless of sort order
      render(
        <ModelSelector
          models={[deprecatedModel, activeModel, futureDeprecatedModel]}
          showDeprecated={true}
          sortOrder="name"
          onChange={vi.fn()}
        />,
      )

      await user.click(screen.getByRole('combobox'))

      const modelNames = screen.getAllByText(/^(Old Model|Active Model|Future Deprecated)$/)
      // Alphabetically: Active Model, Future Deprecated, Old Model
      // But Old Model is past-deprecated so it moves to end
      // Future Deprecated is NOT past-deprecated (date is in the future) so it stays in alpha order
      expect(modelNames[0]).toHaveTextContent('Active Model')
      expect(modelNames[1]).toHaveTextContent('Future Deprecated')
      expect(modelNames[2]).toHaveTextContent('Old Model')
    })

    it('deprecation boundary is captured once at mount (no flicker on re-open)', async () => {
      // Regression guard: previously the component refreshed its `now` reference
      // every time the popover opened (useEffect on `open`). That caused models
      // crossing the deprecation boundary mid-session to appear/disappear between
      // opens. `now` is now captured once at mount.
      const RealDate = Date
      let currentTime = new Date('2098-01-01T00:00:00Z').getTime()
      class ShimDate extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) super(currentTime)
          else super(...(args as ConstructorParameters<typeof Date>))
        }
        static now() {
          return currentTime
        }
      }
      globalThis.Date = ShimDate as unknown as DateConstructor

      try {
        const user = userEvent.setup()
        render(
          <ModelSelector
            models={[activeModel, futureDeprecatedModel]}
            showDeprecated={false}
            onChange={vi.fn()}
          />,
        )

        const trigger = screen.getByRole('combobox')
        await user.click(trigger)
        expect(screen.getByText('Future Deprecated')).toBeInTheDocument()
        await user.keyboard('{Escape}')

        // Advance wall-clock past the 2099 deprecation date.
        currentTime = new Date('2099-06-01T00:00:00Z').getTime()

        await user.click(trigger)
        // If `now` were refreshed on open, the future-deprecated model would
        // now be past-deprecated and filtered out. Stable `now` keeps it visible.
        expect(screen.getByText('Future Deprecated')).toBeInTheDocument()
      } finally {
        globalThis.Date = RealDate
      }
    })
  })

  describe('Memoization stability', () => {
    it('handleModelSelect still resolves the correct model after a favorite toggle', async () => {
      // Regression guard: handleModelSelect previously depended on `allModels`,
      // so every favorite-toggle recreated it and broke ModelItem's memoization.
      // The callback now reads from a live ref, so identity stays stable AND
      // it still resolves the latest list — toggling favorites between mount
      // and click must not corrupt the selection.
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={onChange} />)

      await user.click(screen.getByRole('combobox'))
      const favButtons = await screen.findAllByRole('button', { name: /Add to favorites/ })
      await user.click(favButtons[1]) // toggle Claude 3 Opus into favorites
      await user.click(screen.getAllByText('Claude 3 Opus')[0])

      expect(onChange).toHaveBeenCalledTimes(1)
      const [id, model] = onChange.mock.calls[0]
      expect(id).toBe('claude-3-opus')
      expect(model).toMatchObject({ id: 'claude-3-opus' })
      expect(model).not.toBeNull()
    })
  })

  describe('Empty models array', () => {
    it('renders and opens popover without crashing when models is an empty array', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={[]} onChange={vi.fn()} />)

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveTextContent('Select model...')

      await user.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      // With no models, the search input should still be present
      expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument()

      // The system default option is still available (showSystemDefault=true by default)
      expect(screen.getAllByText('Use System Default').length).toBeGreaterThanOrEqual(1)

      // The "All Models" group heading should be present but the group should be empty
      expect(screen.getByText('All Models')).toBeInTheDocument()
    })

    it('shows "No model found." when models is empty and showSystemDefault is false', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={[]} showSystemDefault={false} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('No model found.')).toBeVisible()
      })
    })

    it('warns once in dev when neither `baseUrl` nor `models` is provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      render(<ModelSelector onChange={vi.fn()} />)
      const calls = warn.mock.calls.flat().filter((arg) => typeof arg === 'string')
      expect(calls.some((c) => c.includes('rendered with no `models` and no `baseUrl`'))).toBe(true)
    })

    it('does NOT warn when only `baseUrl` is provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const fetcher = createFetchMock(mockModels)
      render(
        <ModelSelector baseUrl="https://api.example.com/v1" fetcher={fetcher} onChange={vi.fn()} />,
      )
      const calls = warn.mock.calls.flat().filter((arg) => typeof arg === 'string')
      expect(calls.some((c) => c.includes('rendered with no `models`'))).toBe(false)
    })
  })

  describe('SSR / hydration safety', () => {
    it('can be rendered to string via renderToString without throwing', () => {
      expect(() => {
        const html = renderToString(<ModelSelector models={mockModels} />)
        expect(typeof html).toBe('string')
        expect(html.length).toBeGreaterThan(0)
      }).not.toThrow()
    })

    it('can be rendered to string with an empty models array', () => {
      expect(() => {
        const html = renderToString(<ModelSelector models={[]} />)
        expect(typeof html).toBe('string')
      }).not.toThrow()
    })
  })

  describe('Keyboard navigation', () => {
    it('supports arrow-key navigation between model items', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)

      await user.click(screen.getByRole('combobox'))

      // The search input should be focused after opening
      const searchInput = screen.getByPlaceholderText('Search models...')
      expect(searchInput).toHaveFocus()

      // Press ArrowDown to navigate into the list
      await user.keyboard('{ArrowDown}')

      // cmdk manages its own aria-selected state on items.
      // After ArrowDown from search, the first item should become active.
      // We verify that at least one option element has aria-selected="true"
      await waitFor(() => {
        const options = screen.getAllByRole('option')
        const selectedOption = options.find((opt) => opt.getAttribute('aria-selected') === 'true')
        expect(selectedOption).toBeDefined()
      })

      // Press ArrowDown again to move to the next item
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        const options = screen.getAllByRole('option')
        const selectedOptions = options.filter(
          (opt) => opt.getAttribute('aria-selected') === 'true',
        )
        // Exactly one item should be selected at a time
        expect(selectedOptions).toHaveLength(1)
      })
    })

    it('selects a model with Enter after arrow-key navigation', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={onChange} />)

      await user.click(screen.getByRole('combobox'))

      // Navigate down and select with Enter
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      // onChange should have been called with a model id
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ id: expect.any(String) }),
        )
      })
    })
  })

  describe('Type filter chip', () => {
    const multiTypeModels: AnyModel[] = [
      mockModels[0], // text
      mockModels[1], // text
      {
        id: 'flux-dev',
        name: 'Flux Dev',
        provider: 'venice',
        created: 1_700_000_000,
        type: 'image',
        is_favorite: false,
        pricing: {},
      } as ImageModel,
      {
        id: 'sdxl',
        name: 'SDXL',
        provider: 'venice',
        created: 1_700_000_001,
        type: 'image',
        is_favorite: false,
        pricing: {},
      } as ImageModel,
    ]

    it('renders the chip when catalog has ≥2 types and `type` is unset', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByRole('button', { name: /Filter:/ })).toBeInTheDocument()
    })

    it('hides the chip when the `type` prop is set (list is locked)', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} type="text" onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.queryByRole('button', { name: /Filter:/ })).not.toBeInTheDocument()
    })

    it('hides the chip when the catalog contains only one type', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.queryByRole('button', { name: /Filter:/ })).not.toBeInTheDocument()
    })

    it('hides the chip when `showTypeFilter={false}`', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} showTypeFilter={false} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.queryByRole('button', { name: /Filter:/ })).not.toBeInTheDocument()
    })

    it('clicking the chip opens a menu with an All-types option + one per present type', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByRole('button', { name: /Filter:/ }))

      const menu = screen.getByRole('menu')
      const items = screen.getAllByRole('menuitemradio')
      expect(items[0]).toHaveTextContent('All types')
      expect(items[1]).toHaveTextContent('Text')
      expect(items[2]).toHaveTextContent('Image')
      expect(menu).toHaveAttribute('aria-label', 'Filter models by type')
    })

    it('selecting a type filters the list to that type only', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByRole('button', { name: /Filter:/ }))
      await user.click(screen.getByRole('menuitemradio', { name: 'Image' }))

      // Text models gone, image models remain
      expect(screen.queryByText('GPT-4')).not.toBeInTheDocument()
      expect(screen.queryByText('Claude 3 Opus')).not.toBeInTheDocument()
      expect(screen.getByText('Flux Dev')).toBeInTheDocument()
      expect(screen.getByText('SDXL')).toBeInTheDocument()
    })

    it('selecting "All types" restores the full list', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByRole('button', { name: /Filter:/ }))
      await user.click(screen.getByRole('menuitemradio', { name: 'Image' }))
      // Re-open the menu and pick All types
      await user.click(screen.getByRole('button', { name: /Filter:/ }))
      await user.click(screen.getByRole('menuitemradio', { name: 'All types' }))

      expect(screen.getByText('GPT-4')).toBeInTheDocument()
      expect(screen.getByText('Flux Dev')).toBeInTheDocument()
    })

    it('aria-checked reflects the active filter; aria-expanded reflects menu state', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      const chip = screen.getByRole('button', { name: /Filter:/ })
      expect(chip).toHaveAttribute('aria-expanded', 'false')
      expect(chip).toHaveAttribute('aria-haspopup', 'menu')

      await user.click(chip)
      expect(chip).toHaveAttribute('aria-expanded', 'true')

      // All types is the initial active filter
      const allItem = screen.getByRole('menuitemradio', { name: 'All types' })
      expect(allItem).toHaveAttribute('aria-checked', 'true')

      await user.click(screen.getByRole('menuitemradio', { name: 'Image' }))
      // Menu is closed after selection
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()

      // Re-open and the Image option is now the active one
      await user.click(screen.getByRole('button', { name: /Filter:/ }))
      expect(screen.getByRole('menuitemradio', { name: 'Image' })).toHaveAttribute(
        'aria-checked',
        'true',
      )
      expect(screen.getByRole('menuitemradio', { name: 'Text' })).toHaveAttribute(
        'aria-checked',
        'false',
      )
    })

    it('Escape dismisses the menu (Radix also closes the popover — expected)', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))
      const chip = screen.getByRole('button', { name: /Filter:/ })
      await user.click(chip)
      expect(screen.getByRole('menu')).toBeInTheDocument()

      const firstItem = screen.getAllByRole('menuitemradio')[0]
      firstItem.focus()
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('controlled mode: `typeFilter` + `onTypeFilterChange` drive the chip', async () => {
      const onTypeFilterChange = vi.fn()
      const user = userEvent.setup()
      render(
        <ModelSelector
          models={multiTypeModels}
          typeFilter="image"
          onTypeFilterChange={onTypeFilterChange}
          onChange={vi.fn()}
        />,
      )
      await user.click(screen.getByRole('combobox'))

      // Controlled prop wins — only image models shown.
      expect(screen.queryByText('GPT-4')).not.toBeInTheDocument()
      expect(screen.getByText('Flux Dev')).toBeInTheDocument()

      // Label reflects current filter.
      const chip = screen.getByRole('button', { name: 'Filter: Image' })
      await user.click(chip)
      await user.click(screen.getByRole('menuitemradio', { name: 'Text' }))

      expect(onTypeFilterChange).toHaveBeenCalledWith('text')
      // Controlled: no internal state change — list still reflects the prop.
      expect(screen.getByText('Flux Dev')).toBeInTheDocument()
    })

    it('menu options are computed from the pre-filter catalog (stable after narrowing)', async () => {
      const user = userEvent.setup()
      render(<ModelSelector models={multiTypeModels} onChange={vi.fn()} />)
      await user.click(screen.getByRole('combobox'))

      // Narrow to Image.
      await user.click(screen.getByRole('button', { name: /Filter:/ }))
      await user.click(screen.getByRole('menuitemradio', { name: 'Image' }))

      // Re-open — the Text option is still listed even though no Text rows are visible.
      await user.click(screen.getByRole('button', { name: /Filter:/ }))
      expect(screen.getByRole('menuitemradio', { name: 'Text' })).toBeInTheDocument()
      expect(screen.getByRole('menuitemradio', { name: 'Image' })).toBeInTheDocument()
    })
  })
})
