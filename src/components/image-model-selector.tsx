"use client"

import { forwardRef } from 'react'
import { ModelSelector, type ModelSelectorProps } from './model-selector'

export const ImageModelSelector = forwardRef<HTMLDivElement, Omit<ModelSelectorProps, 'type'>>(
  (props, ref) => <ModelSelector ref={ref} type="image" {...props} />
)
ImageModelSelector.displayName = 'ImageModelSelector'
