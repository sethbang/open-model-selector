"use client"

import { forwardRef } from 'react'
import { ModelSelector, type ModelSelectorProps } from './model-selector'

/**
 * Pre-configured ModelSelector that only displays video generation models.
 *
 * @example
 * ```tsx
 * <VideoModelSelector baseUrl="/api/v1" onChange={(id) => setModel(id)} />
 * ```
 */
export const VideoModelSelector = forwardRef<HTMLDivElement, Omit<ModelSelectorProps, 'type'>>(
  (props, ref) => <ModelSelector ref={ref} type="video" {...props} />
)
VideoModelSelector.displayName = 'VideoModelSelector'
