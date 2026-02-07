"use client"

import React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import type { AnyModel } from '../types'
import { formatContextLength, formatFlatPrice, formatAudioPrice, formatDuration } from '../utils/format'
import { cn, isDeprecated } from '../utils/helpers'
import { ModelTooltip } from './model-tooltip'

// --- Inline SVG Icons ---
const Check = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>
)

const Star = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
)

interface ModelItemProps {
  model: AnyModel
  isSelected: boolean
  onSelect: (value: string) => void
  onToggleFavorite: (id: string) => void
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
    if (caps?.supportsVision) parts.push(<span key="vis" className="oms-pill oms-pill-vision">🔍</span>)
    if (caps?.supportsReasoning) parts.push(<span key="reas" className="oms-pill oms-pill-reasoning">🧠</span>)
    if (caps?.optimizedForCode) parts.push(<span key="code" className="oms-pill oms-pill-code">💻</span>)
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
      parts.push(<span key="aud" className="oms-pill oms-pill-audio">🔊</span>)
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
      value={`${model.name} ${model.provider} ${model.id} ${model.description || ''} ${model.type}`}
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
            <span className="oms-item-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {model.name}
              {model.type !== 'text' && (
                <span className="oms-badge-type">{model.type}</span>
              )}
              {model.deprecation && (
                <span className="oms-deprecation-badge">⚠️</span>
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
})
