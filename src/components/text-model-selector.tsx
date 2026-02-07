"use client"

import { forwardRef } from 'react'
import { ModelSelector, type ModelSelectorProps } from './model-selector'

export const TextModelSelector = forwardRef<HTMLDivElement, Omit<ModelSelectorProps, 'type'>>(
  (props, ref) => <ModelSelector ref={ref} type="text" {...props} />
)
TextModelSelector.displayName = 'TextModelSelector'
