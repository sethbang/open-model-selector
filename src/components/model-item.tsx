"use client"

import React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import type { AnyModel } from '../types'
import { formatContextLength, formatFlatPrice, formatAudioPrice, formatDuration } from '../utils/format'
import { cn, isDeprecated } from '../utils/helpers'
import { ModelTooltip } from './model-tooltip'
import { Check, Star, Eye, Brain, Code, Volume2, AlertTriangle } from './icons'

interface ModelItemProps {
  model: AnyModel
  isSelected: boolean
  onSelect: (value: string) => void
  onToggleFavorite: (id: string) => void
}

/**
 * Custom comparator for React.memo. Avoids unnecessary re-renders when model
 * objects are recreated via spread (e.g. `{ ...m, is_favorite: true }`) during
 * favorite toggles. Compares only the fields that affect visual output.
 * @internal Exported for unit testing only.
 */
export function areModelItemPropsEqual(
  prev: ModelItemProps,
  next: ModelItemProps,
): boolean {
  if (prev.isSelected !== next.isSelected) return false
  if (prev.onSelect !== next.onSelect) return false
  if (prev.onToggleFavorite !== next.onToggleFavorite) return false

  // Fast path: same object reference means all model fields match
  if (prev.model === next.model) return true

  // Model reference changed — compare fields that affect rendering
  return (
    prev.model.id === next.model.id &&
    prev.model.is_favorite === next.model.is_favorite &&
    prev.model.name === next.model.name &&
    prev.model.provider === next.model.provider &&
    prev.model.type === next.model.type &&
    prev.model.description === next.model.description &&
    prev.model.deprecation?.date === next.model.deprecation?.date
  )
}

function renderInlineMeta(model: AnyModel): React.ReactNode {
  const parts: React.ReactNode[] = []

  // Provider is always shown
  parts.push(<span key="prov" className="oms-truncate">{model.provider}</span>)

  if (model.type === 'text') {
    if (model.context_length > 0) {
      parts.push(<span key="sep-ctx" className="oms-item-meta-separator" />)
      parts.push(<span key="ctx">{formatContextLength(model.context_length)}</span>)
    }
    const caps = model.capabilities
    if (caps?.supportsVision) parts.push(<span key="vis" className="oms-pill oms-pill-vision"><Eye className="oms-icon" /></span>)
    if (caps?.supportsReasoning) parts.push(<span key="reas" className="oms-pill oms-pill-reasoning"><Brain className="oms-icon" /></span>)
    if (caps?.optimizedForCode) parts.push(<span key="code" className="oms-pill oms-pill-code"><Code className="oms-icon" /></span>)
  } else if (model.type === 'image') {
    if (model.pricing.generation != null) {
      parts.push(<span key="sep-price" className="oms-item-meta-separator" />)
      parts.push(<span key="price">{formatFlatPrice(model.pricing.generation)}</span>)
    }
  } else if (model.type === 'video') {
    if (model.constraints?.durations && model.constraints.durations.length > 0) {
      parts.push(<span key="sep-dur" className="oms-item-meta-separator" />)
      parts.push(<span key="dur">{formatDuration(model.constraints.durations)}</span>)
    }
    if (model.constraints?.audio) {
      parts.push(<span key="aud" className="oms-pill oms-pill-audio"><Volume2 className="oms-icon" /></span>)
    }
  } else if (model.type === 'inpaint') {
    if (model.pricing.generation != null) {
      parts.push(<span key="sep-price" className="oms-item-meta-separator" />)
      parts.push(<span key="price">{formatFlatPrice(model.pricing.generation)}</span>)
    }
  } else if (model.type === 'tts') {
    if (model.voices && model.voices.length > 0) {
      parts.push(<span key="sep-voices" className="oms-item-meta-separator" />)
      parts.push(<span key="voices">{model.voices.length} voices</span>)
    }
  } else if (model.type === 'asr') {
    if (model.pricing.per_audio_second != null) {
      parts.push(<span key="sep-price" className="oms-item-meta-separator" />)
      parts.push(<span key="price">{formatAudioPrice(model.pricing.per_audio_second)}</span>)
    }
  } else if (model.type === 'upscale') {
    if (model.pricing.generation != null) {
      parts.push(<span key="sep-price" className="oms-item-meta-separator" />)
      parts.push(<span key="price">{formatFlatPrice(model.pricing.generation)}</span>)
    }
  }

  return parts.length > 0 ? <div className="oms-item-meta">{parts}</div> : null
}

export const ModelItem = React.memo(function ModelItem({
  model,
  isSelected,
  onSelect,
  onToggleFavorite,
}: ModelItemProps) {
  const deprecatedPast = model.deprecation ? isDeprecated(model.deprecation.date) : false
  const deprecatingFuture = model.deprecation && !deprecatedPast

  const itemClass = cn(
    deprecatedPast && 'oms-deprecated',
    deprecatingFuture && 'oms-deprecating',
  )

  return (
    <CommandPrimitive.Item
      value={model.id}
      keywords={[model.name, model.provider, model.id, model.description || '', model.type]}
      onSelect={() => onSelect(model.id)}
      className={itemClass || undefined}
    >
      <div className="oms-item-content">
        <div className="oms-item-left">
          <Check
            className="oms-icon"
            style={{ opacity: isSelected ? 1 : 0 }}
          />

          <ModelTooltip model={model}>
            <span className="oms-item-name">
              {model.name}
              {model.type !== 'text' && (
                <span className="oms-badge-type">{model.type}</span>
              )}
              {model.deprecation && (
                <span className="oms-deprecation-badge"><AlertTriangle className="oms-icon" /></span>
              )}
            </span>
            {renderInlineMeta(model)}
          </ModelTooltip>
        </div>

        <button
          type="button"
          aria-label={model.is_favorite ? "Remove from favorites" : "Add to favorites"}
          className="oms-star-btn"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
            }
          }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(model.id)
          }}
        >
          <Star
            className={cn(
              "oms-icon",
              model.is_favorite ? "oms-star-filled" : "oms-muted"
            )}
            style={{ opacity: model.is_favorite ? 1 : 0.4 }}
          />
        </button>
      </div>
    </CommandPrimitive.Item>
  )
}, areModelItemPropsEqual)
