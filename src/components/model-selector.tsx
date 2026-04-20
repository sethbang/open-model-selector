'use client'

import * as React from 'react'
import { Command as CommandPrimitive, useCommandState } from 'cmdk'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { AnyModel, ModelType } from '../types'
import { useModels, type UseModelsProps } from '../hooks/use-models'
import { cn } from '../utils/helpers'
import { ModelItem } from './model-item'
import { Check, ChevronsUpDown, ChevronDown, Search, Loader2 } from './icons'

/** Sentinel value representing system default model selection */
export const SYSTEM_DEFAULT_VALUE = 'system_default' as const

/** @internal Dev-mode warning when onChange is omitted */
const defaultOnChange: (modelId: string, model: AnyModel | null) => void = (() => {
  if (process.env.NODE_ENV !== 'production') {
    let warned = false
    return (_modelId: string, _model: AnyModel | null) => {
      if (!warned) {
        warned = true
        console.warn(
          '[open-model-selector] ModelSelector: no `onChange` prop was provided. ' +
            'Selections will be silently ignored. If this is intentional (read-only / display-only usage), ' +
            'you can safely ignore this warning.',
        )
      }
    }
  }
  return () => {}
})()

// --- Internal: aria-live announcer for search result count ---
const ANNOUNCE_DEBOUNCE_MS = 300

/** @internal Announces filtered result count to screen readers via aria-live. Must be rendered inside a CommandPrimitive. */
function SearchResultAnnouncer() {
  const search = useCommandState((state) => state.search)
  const filteredCount = useCommandState((state) => state.filtered.count)
  const [announcement, setAnnouncement] = React.useState('')

  React.useEffect(() => {
    // Only announce when there's an active search query
    if (!search) {
      setAnnouncement('')
      return
    }

    const timer = setTimeout(() => {
      setAnnouncement(
        filteredCount === 0
          ? 'No models found'
          : filteredCount === 1
            ? '1 model found'
            : `${filteredCount} models found`,
      )
    }, ANNOUNCE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [search, filteredCount])

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="oms-sr-only">
      {announcement}
    </div>
  )
}

/** @internal Chip + inline menu used by ModelSelector to filter by type. */
function TypeFilterChip({
  value,
  availableTypes,
  onChange,
}: {
  value: ModelType | null
  availableTypes: ModelType[]
  onChange: (next: ModelType | null) => void
}) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const chipRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click.
  React.useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (chipRef.current?.contains(t) === false && menuRef.current?.contains(t) === false) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const handleSelect = (next: ModelType | null) => {
    onChange(next)
    setMenuOpen(false)
    // Restore focus to the chip so keyboard users can continue without jumping.
    chipRef.current?.focus()
  }

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setMenuOpen(false)
      // Defer focus restoration until after React unmounts the menu.
      queueMicrotask(() => chipRef.current?.focus())
      // Note: Radix Popover listens on document and will also close the outer
      // popover on Escape. That's acceptable UX (Escape is a universal dismiss)
      // and matches the behavior of the sort button and other controls inside
      // the popover. If we wanted submenu-only dismiss, we'd need a document
      // capture-phase listener to pre-empt Radix.
    }
  }

  const label = value ? `Filter: ${TYPE_FILTER_LABELS[value]}` : 'Filter: All types'
  const shortLabel = value ? TYPE_FILTER_LABELS[value] : 'All'

  return (
    <div className="oms-typefilter-wrap">
      <button
        ref={chipRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        className="oms-typefilter-btn"
      >
        <span className="oms-text-xxs oms-typefilter-label">{shortLabel}</span>
        <ChevronDown className="oms-icon oms-icon-xs" />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          tabIndex={-1}
          aria-label="Filter models by type"
          onKeyDown={handleMenuKeyDown}
          className="oms-typefilter-menu"
        >
          <button
            type="button"
            role="menuitemradio"
            aria-checked={value === null}
            onClick={() => handleSelect(null)}
            className="oms-typefilter-menuitem"
          >
            All types
          </button>
          {availableTypes.map((t) => (
            <button
              key={t}
              type="button"
              role="menuitemradio"
              aria-checked={value === t}
              onClick={() => handleSelect(t)}
              className="oms-typefilter-menuitem"
            >
              {TYPE_FILTER_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Types ---
/**
 * Props for the ModelSelector component.
 *
 * The component can operate in two modes:
 * - **Managed Mode**: Provide `baseUrl` (and optionally `apiKey`) to fetch models from an API
 * - **Controlled Mode**: Provide a static `models` array directly
 */
export interface ModelSelectorProps {
  /**
   * Static list of models to display. When a non-empty array is provided,
   * the internal API fetch is disabled and only these models are shown.
   */
  models?: AnyModel[]

  /** Base URL for the OpenAI-compatible API endpoint (e.g., "https://api.venice.ai/api/v1") */
  baseUrl?: string

  /** API key for authentication. Warning: This is visible in browser DevTools. Consider using a backend proxy. */
  apiKey?: string

  /** Filter results to a specific model type. If omitted, returns all types. */
  type?: ModelType

  /**
   * Query parameters appended to the /models endpoint URL as a query string.
   * For Venice.ai, pass { type: 'text' } or { type: 'all' } to filter models server-side.
   * @default {}
   */
  queryParams?: Record<string, string>

  /**
   * Custom fetch function for SSR, testing, or proxy scenarios.
   * If not provided, uses global fetch.
   */
  fetcher?: UseModelsProps['fetcher']

  /**
   * Custom function to extract the raw model array from the API response body.
   * @see UseModelsProps.responseExtractor
   */
  responseExtractor?: UseModelsProps['responseExtractor']

  /**
   * Custom function to normalize each raw model object into an AnyModel.
   * @see UseModelsProps.normalizer
   */
  normalizer?: UseModelsProps['normalizer']

  /** Currently selected model ID (controlled component pattern) */
  value?: string

  /**
   * Callback fired when a model is selected.
   * Receives the model ID and the full model object (or `null` for the system-default sentinel).
   * If omitted, selections are silently ignored (read-only / display-only usage).
   */
  onChange?: (modelId: string, model: AnyModel | null) => void

  /** Callback fired when a model is favorited/unfavorited. Only relevant if favorites are controlled. */
  onToggleFavorite?: (modelId: string) => void

  /** Placeholder text shown when no model is selected. @default "Select model..." */
  placeholder?: string

  /** Current sort order for models. If provided, component operates in controlled mode for sorting. */
  sortOrder?: 'name' | 'created'

  /** Callback fired when sort order changes. Only relevant if `sortOrder` is controlled. */
  onSortChange?: (order: 'name' | 'created') => void

  /** Popover placement relative to the trigger. @default "bottom" */
  side?: 'top' | 'bottom' | 'left' | 'right'

  /** Additional CSS class name(s) to apply to the root element */
  className?: string

  /**
   * Custom localStorage key for persisting favorites in uncontrolled mode.
   * @default "open-model-selector-favorites"
   */
  storageKey?: string

  /** Whether to show the "Use System Default" option. @default true */
  showSystemDefault?: boolean

  /**
   * Whether to show deprecated models. Default: true.
   * When false, models with deprecation.date in the past are hidden.
   * Models with future deprecation dates are always shown with a warning.
   */
  showDeprecated?: boolean

  /** When true, prevents opening the selector and dims the trigger button. */
  disabled?: boolean

  /**
   * Controlled in-menu type filter. When provided, the component renders the
   * filter chip in this state and emits `onTypeFilterChange` on user interaction.
   * Omit for uncontrolled (internal state).
   */
  typeFilter?: ModelType | null

  /** Callback fired when the user changes the in-menu type filter. */
  onTypeFilterChange?: (next: ModelType | null) => void

  /**
   * Force-hide the in-menu type filter chip. By default the chip is shown
   * automatically when the `type` prop is unset and the catalog contains
   * two or more distinct types.
   */
  showTypeFilter?: boolean
}

// Canonical ordering for the type filter menu.
const TYPE_FILTER_ORDER: ModelType[] = [
  'text',
  'image',
  'video',
  'inpaint',
  'embedding',
  'tts',
  'asr',
  'upscale',
]
const TYPE_FILTER_LABELS: Record<ModelType, string> = {
  text: 'Text',
  image: 'Image',
  video: 'Video',
  inpaint: 'Inpaint',
  embedding: 'Embedding',
  tts: 'TTS',
  asr: 'ASR',
  upscale: 'Upscale',
}

/**
 * A searchable, accessible model selector combobox for AI models.
 * Supports managed mode (fetches from API) and controlled mode (static model list).
 * Features include favorites, sorting, deprecation warnings, and screen-reader announcements.
 *
 * @example
 * ```tsx
 * <ModelSelector type="text" baseUrl="/api/v1" onChange={(id) => setModel(id)} />
 * ```
 */
export const ModelSelector = React.forwardRef<HTMLDivElement, ModelSelectorProps>(
  function ModelSelector(
    {
      models = [],
      baseUrl,
      apiKey,
      type,
      queryParams,
      fetcher,
      responseExtractor,
      normalizer,
      value,
      onChange = defaultOnChange,
      onToggleFavorite,
      placeholder = 'Select model...',
      sortOrder: controlledSortOrder,
      onSortChange,
      side = 'bottom',
      className,
      storageKey = 'open-model-selector-favorites',
      showSystemDefault = true,
      showDeprecated = true,
      disabled,
      typeFilter: controlledTypeFilter,
      onTypeFilterChange,
      showTypeFilter,
    },
    ref,
  ) {
    const [open, setOpen] = React.useState(false)
    const listboxId = React.useId() + '-listbox'

    // Dev-mode warn-once-per-instance when neither data source is provided.
    // Tracked via ref so each mount gets its own flag (test-friendly).
    const emptyConfigWarnedRef = React.useRef(false)
    if (
      process.env.NODE_ENV !== 'production' &&
      !baseUrl &&
      models.length === 0 &&
      !emptyConfigWarnedRef.current
    ) {
      emptyConfigWarnedRef.current = true
      console.warn(
        '[open-model-selector] ModelSelector: rendered with no `models` and no `baseUrl`. ' +
          'The list will be empty. Provide a `models` array or a `baseUrl` for managed fetch.',
      )
    }

    // Stable "now" reference for deprecation checks. Captured once at mount to
    // avoid cascading memo invalidations on every popover open; sessions long
    // enough to straddle a deprecation boundary are rare in practice, so the
    // trade-off favors stable identity over "freshness" on each open.
    const nowRef = React.useRef<Date | null>(null)
    if (nowRef.current === null) nowRef.current = new Date()
    const now = nowRef.current

    // When consumer provides models, disable the internal fetch by withholding baseUrl
    const effectiveBaseUrl = models.length > 0 ? undefined : baseUrl
    const {
      models: fetchedModels,
      loading,
      error,
    } = useModels({
      baseUrl: effectiveBaseUrl,
      apiKey,
      type,
      queryParams,
      fetcher,
      responseExtractor,
      normalizer,
    })

    // --- Internal Sort State (Uncontrolled Fallback) ---
    const [internalSortOrder, setInternalSortOrder] = React.useState<'name' | 'created'>('name')

    const sortOrder = controlledSortOrder ?? internalSortOrder

    // --- Internal Type Filter State (Uncontrolled Fallback) ---
    const [internalTypeFilter, setInternalTypeFilter] = React.useState<ModelType | null>(null)
    const typeFilter =
      controlledTypeFilter !== undefined ? controlledTypeFilter : internalTypeFilter
    const setTypeFilter = React.useCallback(
      (next: ModelType | null) => {
        if (onTypeFilterChange) onTypeFilterChange(next)
        else setInternalTypeFilter(next)
      },
      [onTypeFilterChange],
    )
    const handleSortChange = React.useCallback(
      (newOrder: 'name' | 'created') => {
        if (onSortChange) {
          onSortChange(newOrder)
        } else {
          setInternalSortOrder(newOrder)
        }
      },
      [onSortChange],
    )

    // --- Internal Favorites State (Uncontrolled Fallback) ---
    const [localFavorites, setLocalFavorites] = React.useState<string[]>([])

    // Load favorites from localStorage on mount (only if no external handler provided)
    React.useEffect(() => {
      if (!onToggleFavorite && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const parsed: unknown = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
              setLocalFavorites(parsed)
            }
          }
        } catch {
          // Silent failure for localStorage favorites
        }
      }
    }, [onToggleFavorite, storageKey])

    const handleToggleFavorite = React.useCallback(
      (modelId: string) => {
        if (onToggleFavorite) {
          onToggleFavorite(modelId)
        } else {
          setLocalFavorites((prev) => {
            const isFav = prev.includes(modelId)
            const next = isFav ? prev.filter((id) => id !== modelId) : [...prev, modelId]
            try {
              localStorage.setItem(storageKey, JSON.stringify(next))
            } catch {
              // Silent failure for localStorage write
            }
            return next
          })
        }
      },
      [onToggleFavorite, storageKey],
    )

    // Pre-filter catalog: merged + favorites-overlaid + deprecation-filtered +
    // sorted + deprecated-last. The in-menu type filter applies AFTER this, so
    // the filter menu's options are derived from the full pre-filter catalog.
    const preFilterModels = React.useMemo(() => {
      const map = new Map<string, AnyModel>()

      // Merge provided models and fetched models, dedupe by ID
      fetchedModels.forEach((m) => map.set(m.id, m))
      models.forEach((m) => map.set(m.id, m))

      // Apply local favorites overlay if we're in uncontrolled mode
      if (!onToggleFavorite) {
        const favoritesSet = new Set(localFavorites)
        map.forEach((m) => {
          if (favoritesSet.has(m.id)) {
            map.set(m.id, { ...m, is_favorite: true })
          }
        })
      }

      let list = Array.from(map.values())

      // Filter out deprecated models (past date) when showDeprecated is false
      if (!showDeprecated) {
        list = list.filter((m) => {
          if (!m.deprecation) return true
          return new Date(m.deprecation.date) >= now
        })
      }

      // Sort
      if (sortOrder === 'created') {
        list.sort((a, b) => b.created - a.created)
      } else {
        list.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
      }

      // Move deprecated models (past date) to the end
      const nonDeprecated: AnyModel[] = []
      const deprecated: AnyModel[] = []
      for (const m of list) {
        if (m.deprecation && new Date(m.deprecation.date) < now) {
          deprecated.push(m)
        } else {
          nonDeprecated.push(m)
        }
      }

      return [...nonDeprecated, ...deprecated]
    }, [models, fetchedModels, sortOrder, localFavorites, onToggleFavorite, showDeprecated, now])

    // Available types for the filter menu — taken from pre-filter catalog so
    // options stay stable even after the user narrows to a single type.
    const availableTypes = React.useMemo(() => {
      const present = new Set<ModelType>(preFilterModels.map((m) => m.type))
      return TYPE_FILTER_ORDER.filter((t) => present.has(t))
    }, [preFilterModels])

    // The in-menu filter is hidden when the `type` prop locks the list,
    // when the catalog has <2 types, or when explicitly suppressed.
    const typeFilterVisible =
      showTypeFilter !== false && type === undefined && availableTypes.length >= 2

    const allModels = React.useMemo(() => {
      if (!typeFilter || !typeFilterVisible) return preFilterModels
      return preFilterModels.filter((m) => m.type === typeFilter)
    }, [preFilterModels, typeFilter, typeFilterVisible])

    // selectedModel uses the pre-filter catalog so trigger text stays accurate
    // even if the user hides the current selection's type via the filter.
    const selectedModel = React.useMemo(
      () => preFilterModels.find((model) => model.id === value),
      [preFilterModels, value],
    )

    const { favorites, otherModels } = React.useMemo(
      () => ({
        favorites: allModels.filter((m) => m.is_favorite),
        otherModels: allModels.filter((m) => !m.is_favorite),
      }),
      [allModels],
    )

    // Keep a ref to the pre-filter list so `handleModelSelect` stays referentially
    // stable even when favorites/sort/filter recompute `allModels`. Use the
    // pre-filter list so selections still resolve correctly if the click-through
    // row is in the currently-filtered view but also exists in the broader catalog.
    const preFilterModelsRef = React.useRef<AnyModel[]>([])
    preFilterModelsRef.current = preFilterModels

    const handleModelSelect = React.useCallback(
      (id: string) => {
        const model = preFilterModelsRef.current.find((m) => m.id === id) ?? null
        onChange(id, model)
        setOpen(false)
      },
      [onChange],
    )

    const handleOpenChange = React.useCallback(
      (o: boolean) => {
        if (!disabled) setOpen(o)
      },
      [disabled],
    )

    return (
      <div ref={ref} className={cn('oms-reset', className)}>
        <PopoverPrimitive.Root open={disabled ? false : open} onOpenChange={handleOpenChange}>
          <PopoverPrimitive.Trigger asChild>
            <button
              role="combobox"
              aria-expanded={disabled ? false : open}
              aria-haspopup="listbox"
              aria-controls={listboxId}
              aria-label={
                value === SYSTEM_DEFAULT_VALUE
                  ? 'Model selector, Use System Default'
                  : selectedModel
                    ? `Model selector, ${selectedModel.name}`
                    : placeholder
              }
              disabled={disabled}
              className={cn('oms-trigger-btn', disabled && 'oms-disabled')}
            >
              {value === SYSTEM_DEFAULT_VALUE ? (
                <span className="oms-muted">Use System Default</span>
              ) : selectedModel ? (
                <span className="oms-truncate oms-flex-row oms-items-center oms-gap-2">
                  <span className="oms-truncate">{selectedModel.name}</span>
                  <span className="oms-muted oms-text-xxs oms-truncate">
                    ({selectedModel.provider})
                  </span>
                </span>
              ) : (
                <span className="oms-muted">{placeholder}</span>
              )}
              {loading ? (
                <Loader2 className="oms-icon oms-spin oms-muted oms-icon-trailing" />
              ) : (
                <ChevronsUpDown className="oms-icon oms-muted oms-icon-trailing" />
              )}
            </button>
          </PopoverPrimitive.Trigger>

          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              id={listboxId}
              className="oms-popover-content"
              align="start"
              side={side}
              sideOffset={4}
            >
              <CommandPrimitive className="oms-command">
                <div className="oms-search-container">
                  <Search className="oms-icon oms-muted oms-search-icon" />
                  {/* Combobox pattern focuses the search field when the popover
                          opens so typing filters immediately. */}
                  <CommandPrimitive.Input
                    placeholder="Search models..."
                    aria-label="Search models"
                    autoFocus
                  />

                  <button
                    // aria-label describes the CURRENT state so screen readers
                    // announce what the user just toggled to, not the next action.
                    aria-label={sortOrder === 'name' ? 'Sort: name (A–Z)' : 'Sort: newest first'}
                    aria-pressed={sortOrder === 'created'}
                    onClick={() => handleSortChange(sortOrder === 'name' ? 'created' : 'name')}
                    className="oms-sort-btn"
                  >
                    <span className="oms-text-xxs oms-sort-label">
                      {sortOrder === 'name' ? 'AZ' : 'New'}
                    </span>
                    <ChevronDown className="oms-icon oms-icon-xs" />
                  </button>

                  {typeFilterVisible && (
                    <TypeFilterChip
                      value={typeFilter}
                      availableTypes={availableTypes}
                      onChange={setTypeFilter}
                    />
                  )}
                </div>

                <SearchResultAnnouncer />

                <CommandPrimitive.List>
                  {loading && (
                    <div role="status" aria-live="polite" className="oms-loading-state">
                      <Loader2 className="oms-icon oms-spin" /> Loading...
                    </div>
                  )}

                  {error && (
                    <div role="alert" className="oms-error-state">
                      Error: {error.message}
                    </div>
                  )}

                  {!loading && !error && (
                    <CommandPrimitive.Empty className="oms-empty-state">
                      No model found.
                    </CommandPrimitive.Empty>
                  )}

                  {showSystemDefault && (
                    <CommandPrimitive.Group>
                      <CommandPrimitive.Item
                        value={SYSTEM_DEFAULT_VALUE}
                        onSelect={() => handleModelSelect(SYSTEM_DEFAULT_VALUE)}
                      >
                        <div className="oms-item-content">
                          <div className="oms-item-left">
                            <Check
                              className="oms-icon"
                              style={{ opacity: value === SYSTEM_DEFAULT_VALUE ? 1 : 0 }}
                            />
                            <span>Use System Default</span>
                          </div>
                        </div>
                      </CommandPrimitive.Item>
                    </CommandPrimitive.Group>
                  )}

                  {showSystemDefault && <CommandPrimitive.Separator />}

                  {favorites.length > 0 && (
                    <CommandPrimitive.Group heading="Favorites">
                      {favorites.map((model) => (
                        <ModelItem
                          key={model.id}
                          model={model}
                          isSelected={value === model.id}
                          onSelect={handleModelSelect}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </CommandPrimitive.Group>
                  )}

                  <CommandPrimitive.Group heading="All Models">
                    {otherModels.map((model) => (
                      <ModelItem
                        key={model.id}
                        model={model}
                        isSelected={value === model.id}
                        onSelect={handleModelSelect}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </CommandPrimitive.Group>
                </CommandPrimitive.List>
              </CommandPrimitive>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    )
  },
)

ModelSelector.displayName = 'ModelSelector'
