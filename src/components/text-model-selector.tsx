"use client"

import { forwardRef } from 'react'
import { ModelSelector, type ModelSelectorProps } from './model-selector'

/**
 * Pre-configured ModelSelector that only displays text/chat models.
 *
 * @example
 * ```tsx
 * <TextModelSelector baseUrl="/api/v1" onChange={(id) => setModel(id)} />
 * ```
 */
export const TextModelSelector = forwardRef<HTMLDivElement, Omit<ModelSelectorProps, 'type'>>(
  (props, ref) => <ModelSelector ref={ref} type="text" {...props} />
)
TextModelSelector.displayName = 'TextModelSelector'
