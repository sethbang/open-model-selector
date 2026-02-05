"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Model, useOpenAIModels } from "../hooks/use-openai-models"

export type { Model }

/** Sentinel value representing system default model selection */
export const SYSTEM_DEFAULT_VALUE = "system_default" as const

// --- Icons (Inline SVGs) ---
const Icons = {
  Check: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>
  ),
  ChevronsUpDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
  ),
  ChevronDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6"/></svg>
  ),
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  Loader2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  ),
  Star: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  )
}

// --- Utils ---
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
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
  /** Static list of models to display. If provided, API fetching is disabled. */
  models?: Model[]
  
  /** Base URL for the OpenAI-compatible API endpoint (e.g., "https://api.openai.com/v1") */
  baseUrl?: string
  
  /** API key for authentication. Warning: This is visible in browser DevTools. Consider using a backend proxy. */
  apiKey?: string
  
  /** Currently selected model ID (controlled component pattern) */
  value?: string
  
  /** Callback fired when a model is selected. Receives the model ID. */
  onChange: (modelId: string) => void
  
  /** Callback fired when a model is favorited/unfavorited. Only relevant if favorites are controlled. */
  onToggleFavorite?: (modelId: string) => void
  
  /** Placeholder text shown when no model is selected. @default "Select model..." */
  placeholder?: string
  
  /** Current sort order for models. If provided, component operates in controlled mode for sorting. */
  sortOrder?: "name" | "created"
  
  /** Callback fired when sort order changes. Only relevant if `sortOrder` is controlled. */
  onSortChange?: (order: "name" | "created") => void
  
  /** Popover placement relative to the trigger. @default "bottom" */
  side?: "top" | "bottom" | "left" | "right"
}

export const ModelSelector = React.forwardRef<HTMLDivElement, ModelSelectorProps>(
  function ModelSelector(
    {
      models = [],
      baseUrl,
      apiKey,
      value,
      onChange,
      onToggleFavorite,
      placeholder = "Select model...",
      sortOrder: controlledSortOrder,
      onSortChange,
      side = "bottom",
    },
    ref
  ) {
  const [open, setOpen] = React.useState(false)
  const { models: fetchedModels, loading, error } = useOpenAIModels({ baseUrl, apiKey })

  // --- Internal Sort State (Uncontrolled Fallback) ---
  const [internalSortOrder, setInternalSortOrder] = React.useState<"name" | "created">("name")
  
  const sortOrder = controlledSortOrder ?? internalSortOrder
  const handleSortChange = React.useCallback((newOrder: "name" | "created") => {
    if (onSortChange) {
        onSortChange(newOrder)
    } else {
        setInternalSortOrder(newOrder)
    }
  }, [onSortChange])

  // --- Internal Favorites State (Uncontrolled Fallback) ---
  const [localFavorites, setLocalFavorites] = React.useState<string[]>([])
  
  // Load favorites from localStorage on mount (only if no external handler provided)
  React.useEffect(() => {
    if (!onToggleFavorite && typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem("open-model-selector-favorites")
            if (stored) {
                setLocalFavorites(JSON.parse(stored))
            }
        } catch (e) {
            console.error("Failed to load favorites", e)
        }
    }
  }, [onToggleFavorite])

  const handleToggleFavorite = React.useCallback((modelId: string) => {
    if (onToggleFavorite) {
        onToggleFavorite(modelId)
    } else {
        // Uncontrolled mode: toggle locally and persist
        setLocalFavorites(prev => {
            const isFav = prev.includes(modelId)
            const next = isFav ? prev.filter(id => id !== modelId) : [...prev, modelId]
            localStorage.setItem("open-model-selector-favorites", JSON.stringify(next))
            return next
        })
    }
  }, [onToggleFavorite])

  const allModels = React.useMemo(() => {
    const map = new Map<string, Model>()
    
    // Merge provided models and fetched models, dedupe by ID
    // User provided models take precedence if IDs conflict
    fetchedModels.forEach(m => map.set(m.id, m))
    models.forEach(m => map.set(m.id, m))
    
    // Apply local favorites overlay if we're in uncontrolled mode
    if (!onToggleFavorite) {
        map.forEach((m) => {
            if (localFavorites.includes(m.id)) {
                // Return a new object so we don't mutate the source
                map.set(m.id, { ...m, is_favorite: true })
            }
        })
    }

    // Sort
    const list = Array.from(map.values())
    
    if (sortOrder === "created") {
        list.sort((a, b) => b.created - a.created)
    } else {
        list.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
    }

    return list
  }, [models, fetchedModels, sortOrder, localFavorites, onToggleFavorite])

  const selectedModel = allModels.find((model) => model.id === value)
  const favorites = allModels.filter((m) => m.is_favorite)
  const otherModels = allModels.filter((m) => !m.is_favorite)

  return (
    <div ref={ref} className="oms-reset">
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            className="oms-trigger-btn"
          >
            {value === SYSTEM_DEFAULT_VALUE ? (
               <span className="oms-muted">Use System Default</span>
            ) : selectedModel ? (
              <span className="oms-truncate oms-flex-row oms-items-center oms-gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                   <span className="oms-truncate">{selectedModel.name}</span>
                   <span className="oms-muted oms-text-xxs oms-truncate">({selectedModel.provider})</span>
              </span>
            ) : (
              <span className="oms-muted">{placeholder}</span>
            )}
            {loading ? (
                <Icons.Loader2 className="oms-icon oms-spin oms-muted" style={{ opacity: 0.5, marginLeft: 'auto' }} />
            ) : (
                <Icons.ChevronsUpDown className="oms-icon oms-muted" style={{ opacity: 0.5, marginLeft: 'auto' }} />
            )}
          </button>
        </PopoverPrimitive.Trigger>
        
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content className="oms-popover-content" align="start" side={side} sideOffset={4}>
                <CommandPrimitive className="oms-command">
                   <div className="oms-search-container">
                      <Icons.Search className="oms-icon oms-muted" style={{ marginRight: '8px', opacity: 0.5 }} />
                      <CommandPrimitive.Input
                          placeholder="Search models..."
                          aria-label="Search models"
                          autoFocus
                      />
                      
                      <DropdownMenuPrimitive.Root>
                        <DropdownMenuPrimitive.Trigger asChild>
                          <button aria-label="Sort models" style={{ marginLeft: '4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: '4px' }}>
                            <span className="oms-text-xxs" style={{ fontWeight: 700 }}>{sortOrder === "name" ? "AZ" : "New"}</span>
                            <Icons.ChevronDown className="oms-icon" style={{ width: '8px', height: '8px' }} />
                          </button>
                        </DropdownMenuPrimitive.Trigger>
                        <DropdownMenuPrimitive.Portal>
                           <DropdownMenuPrimitive.Content className="oms-popover-content" align="end" sideOffset={5} style={{ width: '120px' }}>
                                <DropdownMenuPrimitive.Item 
                                    className="oms-item-content"
                                    style={{ padding: '8px', cursor: 'pointer', fontSize: '12px' }}
                                    onSelect={() => handleSortChange("name")}
                                >
                                    Name (A-Z)
                                </DropdownMenuPrimitive.Item>
                                <DropdownMenuPrimitive.Item 
                                    className="oms-item-content"
                                    style={{ padding: '8px', cursor: 'pointer', fontSize: '12px' }}
                                    onSelect={() => handleSortChange("created")}
                                >
                                    Newest
                                </DropdownMenuPrimitive.Item>
                           </DropdownMenuPrimitive.Content>
                        </DropdownMenuPrimitive.Portal>
                      </DropdownMenuPrimitive.Root>
                   </div>
        
                  <CommandPrimitive.List>
                    {loading && (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--oms-muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Icons.Loader2 className="oms-icon oms-spin" /> Loading...
                        </div>
                    )}
                    
                    {error && (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--oms-destructive)' }}>
                            Error: {(error as Error).message}
                        </div>
                    )}
        
                    {!loading && !error && (
                        <CommandPrimitive.Empty style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--oms-muted-foreground)' }}>
                             No model found.
                        </CommandPrimitive.Empty>
                    )}
                    
                    <CommandPrimitive.Group>
                        <CommandPrimitive.Item
                          value={SYSTEM_DEFAULT_VALUE}
                          onSelect={() => {
                            onChange(SYSTEM_DEFAULT_VALUE)
                            setOpen(false)
                          }}
                        >
                          <div className="oms-item-content">
                              <div className="oms-item-left">
                                  <Icons.Check className="oms-icon" style={{ opacity: value === SYSTEM_DEFAULT_VALUE ? 1 : 0 }} />
                                  <span>Use System Default</span>
                              </div>
                          </div>
                        </CommandPrimitive.Item>
                    </CommandPrimitive.Group>
                    
                    <CommandPrimitive.Separator />
        
                    {favorites.length > 0 && (
                      <CommandPrimitive.Group heading="Favorites">
                        {favorites.map((model) => (
                          <ModelItem
                            key={model.id}
                            model={model}
                            isSelected={value === model.id}
                            onSelect={(id) => {
                              onChange(id)
                              setOpen(false)
                            }}
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
                          onSelect={(id) => {
                            onChange(id)
                            setOpen(false)
                          }}
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
  }
)

ModelSelector.displayName = "ModelSelector"

const ModelItem = React.memo(function ModelItem({
  model,
  isSelected,
  onSelect,
  onToggleFavorite,
}: {
  model: Model
  isSelected: boolean
  onSelect: (value: string) => void
  onToggleFavorite: (id: string) => void
}) {
  return (
    <CommandPrimitive.Item
      value={model.name + " " + model.provider + " " + model.id}
      onSelect={() => onSelect(model.id)}
    >
      <div className="oms-item-content">
          <div className="oms-item-left">
            <Icons.Check 
                className="oms-icon" 
                style={{ opacity: isSelected ? 1 : 0 }} 
            />
            
            <HoverCardPrimitive.Root openDelay={200} closeDelay={100}>
                 <HoverCardPrimitive.Trigger asChild>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'help', maxWidth: '180px' }}>
                        <span className="oms-truncate" style={{ fontWeight: 500 }}>{model.name}</span>
                        <span className="oms-truncate oms-text-xxs oms-muted">{model.provider}</span>
                    </div>
                 </HoverCardPrimitive.Trigger>
                 <HoverCardPrimitive.Portal>
                     <HoverCardPrimitive.Content className="oms-hover-content" side="right" align="start" sideOffset={5}>
                        <div className="oms-flex-col oms-gap-2">
                            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{model.name}</h4>
                            {model.description && (
                                <p className="oms-text-xs oms-muted">{model.description}</p>
                            )}
                            <div className="oms-flex-row oms-gap-2" style={{ flexWrap: 'wrap' }}>
                                {model.context_length > 0 && (
                                    <span className="oms-badge oms-badge-secondary">
                                        {Math.round(model.context_length / 1000)}k Context
                                    </span>
                                )}
                                <span className="oms-badge oms-badge-outline">{model.provider}</span>
                            </div>
                            {model.pricing && (
                                <div className="oms-grid-2 oms-text-xxs oms-border-t oms-pt-2">
                                     <div>
                                        <span className="oms-muted">Input:</span> <br/>
                                        <span className="oms-mono">{formatPrice(model.pricing.prompt as string | number)} / 1M</span>
                                     </div>
                                     <div>
                                        <span className="oms-muted">Output:</span> <br/>
                                        <span className="oms-mono">{formatPrice(model.pricing.completion as string | number)} / 1M</span>
                                     </div>
                                </div>
                            )}
                        </div>
                     </HoverCardPrimitive.Content>
                 </HoverCardPrimitive.Portal>
            </HoverCardPrimitive.Root>
          </div>
          
          <div 
            role="button"
            tabIndex={0}
            aria-label={model.is_favorite ? "Remove from favorites" : "Add to favorites"}
            className="oms-star-btn"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggleFavorite(model.id)
                }
            }}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFavorite(model.id)
            }}
          >
            <Icons.Star 
                className={cn(
                    "oms-icon", 
                    model.is_favorite ? "oms-star-filled" : "oms-muted"
                )}
                style={{ opacity: model.is_favorite ? 1 : 0.2 }}
            />
          </div>
      </div>
    </CommandPrimitive.Item>
  )
})

function formatPrice(value: string | number): string {
    if (!value) return "$0"
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num)) return "$0"
    const perMillion = num * 1000000
    if (perMillion < 0.01) return "$" + perMillion.toFixed(6)
    return "$" + perMillion.toFixed(2)
}
