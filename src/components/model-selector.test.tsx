import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelSelector, SYSTEM_DEFAULT_VALUE } from './model-selector'
import type { TextModel } from '../types'

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
      const { container } = render(<ModelSelector models={mockModels} className="my-custom-class" />)
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

      expect(onChange).toHaveBeenCalledWith('claude-3-opus')
    })

    it('calls onChange with SYSTEM_DEFAULT_VALUE when system default is selected', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ModelSelector models={mockModels} onChange={onChange} showSystemDefault />)

      await user.click(screen.getByRole('combobox'))
      
      // Find all "Use System Default" texts — one in trigger, one in popover list
      const systemDefaultOptions = screen.getAllByText('Use System Default')
      // Click the last one (the one in the popover list)
      await user.click(systemDefaultOptions[systemDefaultOptions.length - 1])

      expect(onChange).toHaveBeenCalledWith(SYSTEM_DEFAULT_VALUE)
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
        <ModelSelector
          baseUrl="https://api.example.com/v1"
          fetcher={fetcher}
          onChange={vi.fn()}
        />
      )

      // Wait for fetch to complete (useModels appends no query string by default)
      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledWith(
          'https://api.example.com/v1/models',
          expect.objectContaining({
            headers: {},
            signal: expect.any(AbortSignal),
          })
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
        />
      )

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: 'Bearer sk-test-key' },
          })
        )
      })
    })

    it('displays error message when fetch fails', async () => {
      const fetcher = createFailingFetchMock(500, 'Internal Server Error')
      const user = userEvent.setup()

      render(
        <ModelSelector
          baseUrl="https://api.example.com/v1"
          fetcher={fetcher}
          onChange={vi.fn()}
        />
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
        />
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
        />
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
        />
      )

      await user.click(screen.getByRole('combobox'))

      // Click the sort toggle button — it cycles from "name" to "created"
      const sortButton = screen.getByLabelText('Sort models by newest')
      await user.click(sortButton)

      expect(onSortChange).toHaveBeenCalledWith('created')
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
})
