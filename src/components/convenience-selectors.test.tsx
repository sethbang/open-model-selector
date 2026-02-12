import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { TextModelSelector } from './text-model-selector'
import { ImageModelSelector } from './image-model-selector'
import { VideoModelSelector } from './video-model-selector'
import type { TextModel, ImageModel, VideoModel } from '../types'

// --- Minimal fixtures (one model per type) ---

const textModel: TextModel = {
  id: 'gpt-4',
  name: 'GPT-4',
  provider: 'openai',
  created: 1700000000,
  type: 'text',
  context_length: 8192,
  pricing: { prompt: 0.00003, completion: 0.00006 },
  is_favorite: false,
}

const imageModel: ImageModel = {
  id: 'dall-e-3',
  name: 'DALL-E 3',
  provider: 'openai',
  created: 1700000000,
  type: 'image',
  pricing: { generation: 0.04 },
  is_favorite: false,
}

const videoModel: VideoModel = {
  id: 'gen-3',
  name: 'Gen 3',
  provider: 'runway',
  created: 1700000000,
  type: 'video',
  is_favorite: false,
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// --- TextModelSelector ---

describe('TextModelSelector', () => {
  it('renders a combobox trigger', () => {
    render(<TextModelSelector models={[textModel]} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<TextModelSelector ref={ref} models={[textModel]} onChange={vi.fn()} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('displays displayName', () => {
    expect(TextModelSelector.displayName).toBe('TextModelSelector')
  })
})

// --- ImageModelSelector ---

describe('ImageModelSelector', () => {
  it('renders a combobox trigger', () => {
    render(<ImageModelSelector models={[imageModel]} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<ImageModelSelector ref={ref} models={[imageModel]} onChange={vi.fn()} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('displays displayName', () => {
    expect(ImageModelSelector.displayName).toBe('ImageModelSelector')
  })
})

// --- VideoModelSelector ---

describe('VideoModelSelector', () => {
  it('renders a combobox trigger', () => {
    render(<VideoModelSelector models={[videoModel]} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<VideoModelSelector ref={ref} models={[videoModel]} onChange={vi.fn()} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('displays displayName', () => {
    expect(VideoModelSelector.displayName).toBe('VideoModelSelector')
  })
})
