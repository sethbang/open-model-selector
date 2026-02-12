"use client"

import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import type { AnyModel } from '../types'
import {
  formatPrice,
  formatContextLength,
  formatFlatPrice,
  formatAudioPrice,
  formatDuration,
  formatResolutions,
  formatAspectRatios,
} from '../utils/format'
import { isDeprecated } from '../utils/helpers'
import { AlertTriangle, Lock, EyeOff, Zap, CircleX, Eye, Brain, Code, Wrench, Search, Volume2 } from './icons'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

interface ModelTooltipProps {
  model: AnyModel
  children: React.ReactNode
}

function renderDeprecationWarning(model: AnyModel) {
  if (!model.deprecation) return null
  const past = isDeprecated(model.deprecation.date)
  return (
    <div className="oms-deprecation-badge">
      <AlertTriangle className="oms-icon" /> {past ? 'Deprecated' : 'Deprecating'} {model.deprecation.date}
    </div>
  )
}

function renderSharedBadges(model: AnyModel) {
  const pills: React.ReactNode[] = []
  if (model.privacy === 'private') {
    pills.push(<span key="priv" className="oms-pill oms-pill-private"><Lock className="oms-icon" /> Private</span>)
  } else if (model.privacy === 'anonymized') {
    pills.push(<span key="anon" className="oms-pill oms-pill-anonymized"><EyeOff className="oms-icon" /> Anonymized</span>)
  }
  if (model.betaModel) {
    pills.push(<span key="beta" className="oms-pill oms-pill-beta"><Zap className="oms-icon" /> Beta</span>)
  }
  if (model.offline) {
    pills.push(<span key="offline" className="oms-offline-indicator"><CircleX className="oms-icon" /> Offline</span>)
  }
  return pills.length > 0 ? pills : null
}

function renderTextContent(model: AnyModel) {
  if (model.type !== 'text') return null
  const caps = model.capabilities
  const capPills: React.ReactNode[] = []
  if (caps?.supportsVision) capPills.push(<span key="vis" className="oms-pill oms-pill-vision"><Eye className="oms-icon" /> Vision</span>)
  if (caps?.supportsReasoning) capPills.push(<span key="reas" className="oms-pill oms-pill-reasoning"><Brain className="oms-icon" /> Reasoning</span>)
  if (caps?.optimizedForCode) capPills.push(<span key="code" className="oms-pill oms-pill-code"><Code className="oms-icon" /> Code</span>)
  if (caps?.supportsFunctionCalling) capPills.push(<span key="func" className="oms-pill oms-pill-functions"><Wrench className="oms-icon" /> Functions</span>)

  return (
    <>
      {model.description && (
        <p className="oms-text-xs oms-muted">{model.description}</p>
      )}
      {capPills.length > 0 && (
        <div className="oms-tooltip-pills">{capPills}</div>
      )}
      <div className="oms-flex-row oms-gap-2 oms-flex-wrap">
        {model.context_length > 0 && (
          <span className="oms-badge oms-badge-secondary">
            {formatContextLength(model.context_length)} Context
          </span>
        )}
        <span className="oms-badge oms-badge-outline">{model.provider}</span>
      </div>
      {model.pricing && (
        <div className="oms-tooltip-section">
          <div className="oms-tooltip-grid">
            <span className="oms-tooltip-grid-label">Input:</span>
            <span className="oms-tooltip-grid-value">{formatPrice(model.pricing.prompt)} / 1M</span>
            <span className="oms-tooltip-grid-label">Output:</span>
            <span className="oms-tooltip-grid-value">{formatPrice(model.pricing.completion)} / 1M</span>
            {model.pricing.cache_input != null && (
              <>
                <span className="oms-tooltip-grid-label">Cache input:</span>
                <span className="oms-tooltip-grid-value">{formatPrice(model.pricing.cache_input)} / 1M</span>
              </>
            )}
            {model.pricing.cache_write != null && (
              <>
                <span className="oms-tooltip-grid-label">Cache write:</span>
                <span className="oms-tooltip-grid-value">{formatPrice(model.pricing.cache_write)} / 1M</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function renderImageContent(model: AnyModel) {
  if (model.type !== 'image') return null
  return (
    <>
      <span className="oms-badge oms-badge-outline">{model.provider}</span>
      <div className="oms-tooltip-section">
        <div className="oms-tooltip-grid">
          {model.pricing.resolutions ? (
            Object.entries(model.pricing.resolutions).map(([res, price]) => (
              <React.Fragment key={res}>
                <span className="oms-tooltip-grid-label">{res}:</span>
                <span className="oms-tooltip-grid-value">{formatFlatPrice(price)}</span>
              </React.Fragment>
            ))
          ) : (
            <>
              <span className="oms-tooltip-grid-label">Generation:</span>
              <span className="oms-tooltip-grid-value">{formatFlatPrice(model.pricing.generation)}</span>
            </>
          )}
          {model.pricing.upscale_2x != null && (
            <>
              <span className="oms-tooltip-grid-label">Upscale 2x:</span>
              <span className="oms-tooltip-grid-value">{formatFlatPrice(model.pricing.upscale_2x)}</span>
            </>
          )}
          {model.pricing.upscale_4x != null && (
            <>
              <span className="oms-tooltip-grid-label">Upscale 4x:</span>
              <span className="oms-tooltip-grid-value">{formatFlatPrice(model.pricing.upscale_4x)}</span>
            </>
          )}
        </div>
      </div>
      {model.constraints && (
        <div className="oms-tooltip-section">
          <div className="oms-tooltip-grid">
            {model.constraints.steps && (
              <>
                <span className="oms-tooltip-grid-label">Steps:</span>
                <span className="oms-tooltip-grid-value">1–{model.constraints.steps.max} (default {model.constraints.steps.default})</span>
              </>
            )}
            {model.constraints.aspectRatios && model.constraints.aspectRatios.length > 0 && (
              <>
                <span className="oms-tooltip-grid-label">Aspects:</span>
                <span className="oms-tooltip-grid-value">{formatAspectRatios(model.constraints.aspectRatios)}</span>
              </>
            )}
            {model.constraints.resolutions && model.constraints.resolutions.length > 0 && (
              <>
                <span className="oms-tooltip-grid-label">Resolutions:</span>
                <span className="oms-tooltip-grid-value">{formatResolutions(model.constraints.resolutions)}</span>
              </>
            )}
          </div>
        </div>
      )}
      {model.supportsWebSearch && (
        <div className="oms-tooltip-pills">
          <span className="oms-pill oms-pill-web-search"><Search className="oms-icon" /> Web Search</span>
        </div>
      )}
    </>
  )
}

function renderVideoContent(model: AnyModel) {
  if (model.type !== 'video') return null
  return (
    <>
      <span className="oms-badge oms-badge-outline">{model.provider}</span>
      {model.constraints && (
        <div className="oms-tooltip-section">
          <div className="oms-tooltip-grid">
            {model.constraints.durations && model.constraints.durations.length > 0 && (
              <>
                <span className="oms-tooltip-grid-label">Duration:</span>
                <span className="oms-tooltip-grid-value">{formatDuration(model.constraints.durations)}</span>
              </>
            )}
            {model.constraints.resolutions && model.constraints.resolutions.length > 0 && (
              <>
                <span className="oms-tooltip-grid-label">Resolutions:</span>
                <span className="oms-tooltip-grid-value">{formatResolutions(model.constraints.resolutions)}</span>
              </>
            )}
            {model.constraints.aspect_ratios && model.constraints.aspect_ratios.length > 0 && (
              <>
                <span className="oms-tooltip-grid-label">Aspects:</span>
                <span className="oms-tooltip-grid-value">{formatAspectRatios(model.constraints.aspect_ratios)}</span>
              </>
            )}
          </div>
          {model.constraints.audio && (
            <div className="oms-tooltip-pills">
              <span className="oms-pill oms-pill-audio"><Volume2 className="oms-icon" /> Audio</span>
            </div>
          )}
        </div>
      )}
      {model.model_sets && model.model_sets.length > 0 && (
        <div className="oms-tooltip-pills">
          {model.model_sets.map(s => (
            <span key={s} className="oms-pill">{s}</span>
          ))}
        </div>
      )}
    </>
  )
}

function renderInpaintContent(model: AnyModel) {
  if (model.type !== 'inpaint') return null
  return (
    <>
      <span className="oms-badge oms-badge-outline">{model.provider}</span>
      <div className="oms-tooltip-section">
        <div className="oms-tooltip-grid">
          <span className="oms-tooltip-grid-label">Price:</span>
          <span className="oms-tooltip-grid-value">{formatFlatPrice(model.pricing.generation)}</span>
        </div>
      </div>
      {model.constraints && (
        <div className="oms-tooltip-section">
          <div className="oms-tooltip-grid">
            {model.constraints.aspectRatios && model.constraints.aspectRatios.length > 0 && (
              <>
                <span className="oms-tooltip-grid-label">Aspects:</span>
                <span className="oms-tooltip-grid-value">{formatAspectRatios(model.constraints.aspectRatios)}</span>
              </>
            )}
            {model.constraints.combineImages && (
              <>
                <span className="oms-tooltip-grid-label">Combine:</span>
                <span className="oms-tooltip-grid-value">Yes</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function renderEmbeddingContent(model: AnyModel) {
  if (model.type !== 'embedding') return null
  return (
    <>
      <span className="oms-badge oms-badge-outline">{model.provider}</span>
      {(model.pricing.input != null || model.pricing.output != null) && (
        <div className="oms-tooltip-section">
          <div className="oms-tooltip-grid">
            {model.pricing.input != null && (
              <>
                <span className="oms-tooltip-grid-label">Input:</span>
                <span className="oms-tooltip-grid-value">{formatPrice(model.pricing.input)} / 1M</span>
              </>
            )}
            {model.pricing.output != null && (
              <>
                <span className="oms-tooltip-grid-label">Output:</span>
                <span className="oms-tooltip-grid-value">{formatPrice(model.pricing.output)} / 1M</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function renderTtsContent(model: AnyModel) {
  if (model.type !== 'tts') return null
  return (
    <>
      <span className="oms-badge oms-badge-outline">{model.provider}</span>
      {model.pricing.input != null && (
        <div className="oms-tooltip-section">
          <div className="oms-tooltip-grid">
            <span className="oms-tooltip-grid-label">Price:</span>
            <span className="oms-tooltip-grid-value">{formatPrice(model.pricing.input)} / 1M</span>
          </div>
        </div>
      )}
      {model.voices && model.voices.length > 0 && (
        <div className="oms-tooltip-section">
          <span className="oms-text-xxs oms-muted">
            {model.voices.length} voice{model.voices.length !== 1 ? 's' : ''} available
          </span>
        </div>
      )}
    </>
  )
}

function renderAsrContent(model: AnyModel) {
  if (model.type !== 'asr') return null
  return (
    <>
      <span className="oms-badge oms-badge-outline">{model.provider}</span>
      {model.pricing.per_audio_second != null && (
        <div className="oms-tooltip-section">
          <div className="oms-tooltip-grid">
            <span className="oms-tooltip-grid-label">Price:</span>
            <span className="oms-tooltip-grid-value">{formatAudioPrice(model.pricing.per_audio_second)}</span>
          </div>
        </div>
      )}
    </>
  )
}

function renderUpscaleContent(model: AnyModel) {
  if (model.type !== 'upscale') return null
  return (
    <>
      <span className="oms-badge oms-badge-outline">{model.provider}</span>
      <div className="oms-tooltip-section">
        <div className="oms-tooltip-grid">
          <span className="oms-tooltip-grid-label">Price:</span>
          <span className="oms-tooltip-grid-value">{formatFlatPrice(model.pricing.generation)}</span>
        </div>
      </div>
    </>
  )
}

function renderTooltipContent(model: AnyModel) {
  switch (model.type) {
    case 'text': return renderTextContent(model)
    case 'image': return renderImageContent(model)
    case 'video': return renderVideoContent(model)
    case 'inpaint': return renderInpaintContent(model)
    case 'embedding': return renderEmbeddingContent(model)
    case 'tts': return renderTtsContent(model)
    case 'asr': return renderAsrContent(model)
    case 'upscale': return renderUpscaleContent(model)
    default: return null
  }
}

export function ModelTooltip({ model, children }: ModelTooltipProps) {
  const [visible, setVisible] = useState(false)
  const tooltipId = useId()
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const show = useCallback(() => {
    clearTimeout(closeTimer.current)
    openTimer.current = setTimeout(() => setVisible(true), 200)
  }, [])

  const hide = useCallback(() => {
    clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setVisible(false), 100)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && visible) {
      clearTimeout(openTimer.current)
      setVisible(false)
    }
  }, [visible])

  // Position the tooltip to the right of the trigger
  useIsomorphicLayoutEffect(() => {
    if (visible && triggerRef.current && contentRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const content = contentRef.current
      content.style.position = 'fixed'
      content.style.left = `${rect.right + 5}px`
      content.style.top = `${rect.top}px`

      // If it overflows the viewport right edge, flip to left side
      const contentRect = content.getBoundingClientRect()
      if (contentRect.right > window.innerWidth) {
        content.style.left = `${rect.left - contentRect.width - 5}px`
      }
      // If it overflows the viewport bottom, shift up
      if (contentRect.bottom > window.innerHeight) {
        content.style.top = `${window.innerHeight - contentRect.height - 8}px`
      }
    }
  }, [visible])

  // Hide tooltip when any ancestor scrolls (W-8 fix)
  // The tooltip uses position:fixed and is portalled to document.body, so
  // scrolling the list moves the trigger but leaves the tooltip floating.
  // Using capture:true catches scroll events from any scrollable container.
  useEffect(() => {
    if (!visible) return

    const handleScroll = () => {
      clearTimeout(openTimer.current)
      setVisible(false)
    }

    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [visible])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(openTimer.current)
      clearTimeout(closeTimer.current)
    }
  }, [])

  const sharedBadges = renderSharedBadges(model)

  return (
    <>
      <div
        ref={triggerRef}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={handleKeyDown}
        aria-describedby={visible ? tooltipId : undefined}
        className="oms-tooltip-trigger"
      >
        {children}
      </div>
      {visible && createPortal(
        <div
          ref={contentRef}
          id={tooltipId}
          role="tooltip"
          className="oms-hover-content"
          onPointerEnter={show}
          onPointerLeave={hide}
        >
          <div className="oms-flex-col oms-gap-2">
            <h4 className="oms-tooltip-title">{model.name}</h4>
            {renderDeprecationWarning(model)}
            {sharedBadges && (
              <div className="oms-tooltip-pills">{sharedBadges}</div>
            )}
            {renderTooltipContent(model)}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
