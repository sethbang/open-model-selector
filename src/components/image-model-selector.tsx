"use client"

import { forwardRef } from 'react'
import { ModelSelector, type ModelSelectorProps } from './model-selector'

/**
 * Pre-configured ModelSelector that only displays image generation models.
 *
 * @example
 * ```tsx
 * <ImageModelSelector baseUrl="/api/v1" onChange={(id) => setModel(id)} />
 * ```
 */
export const ImageModelSelector = forwardRef<HTMLDivElement, Omit<ModelSelectorProps, 'type'>>(
  (props, ref) => <ModelSelector ref={ref} type="image" {...props} />
)
ImageModelSelector.displayName = 'ImageModelSelector'
