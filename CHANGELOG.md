# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] — 2026-02-06

Initial release of `open-model-selector`.

### Added

- **`<ModelSelector>` component** — accessible combobox for selecting AI models, built with cmdk and Radix Popover
  - Managed mode: fetches models from any OpenAI-compatible `/v1/models` endpoint
  - Controlled mode: accepts a static `models` array
  - Fuzzy search by name, provider, ID, and description
  - Favorites with localStorage persistence (uncontrolled) or external state (controlled via `onToggleFavorite`)
  - Sorting by name (A-Z) or newest, controllable or uncontrolled
  - "Use System Default" sentinel option (`SYSTEM_DEFAULT_VALUE`)
  - Popover placement (`side` prop: top, bottom, left, right)
  - Custom `placeholder` text
  - `className` and `ref` forwarding
  - Configurable `storageKey` for localStorage namespace isolation
  - `showSystemDefault` toggle
  - `onChange` callback receives the model ID **and** the full model object (`AnyModel | null`) — no secondary lookup needed
- **`useModels` hook** — fetches and normalizes models from an OpenAI-compatible API
  - `baseUrl` and `apiKey` props for endpoint configuration
  - Custom `fetcher` prop for SSR, proxies, and testing (ref-stored — no memoization needed)
  - Custom `responseExtractor` for non-standard response shapes
  - Custom `normalizer` for non-standard model shapes
  - AbortController cleanup on unmount
  - Re-fetches on `baseUrl` or `apiKey` change
- **`defaultModelNormalizer`** — handles OpenAI, Venice.ai, and OpenRouter response shapes
  - Extracts provider from slash-separated IDs or `owned_by`
  - Resolves `context_length`, `context_window`, and Venice `model_spec.availableContextTokens`
  - Normalizes pricing from `pricing`, `metadata.pricing`, `cost`, and Venice `model_spec.pricing` formats
  - Falls back to `model_id` when `id` is missing
- **`defaultResponseExtractor`** — handles `{ data: [...] }`, `{ models: [...] }`, and top-level array responses
- **`formatPrice`** — formats per-token prices into per-million-tokens dollar strings with adaptive precision
- **`formatContextLength`** — formats token counts into compact strings (e.g. `128k`, `1M`, `1.5M`)
- **Separate `open-model-selector/utils` entry point** — pure utility functions without `"use client"` directive, safe for React Server Components
  - Normalizers: `defaultModelNormalizer`, `defaultResponseExtractor`, per-type normalizers (`normalizeTextModel`, `normalizeImageModel`, …)
  - Formatters: `formatPrice`, `formatContextLength`, `formatFlatPrice`, `formatAudioPrice`, `formatDuration`, `formatResolutions`, `formatAspectRatios`
  - Helpers: `isDeprecated`
  - All model types re-exported for normalizer consumers
- **Scoped CSS** — all variables use `--oms-` prefix; never pollutes `:root` or host app styles
  - Light theme defaults
  - Dark mode via `@media (prefers-color-scheme: dark)` and `.dark` class ancestor
  - Portal-safe dark mode for popover and tooltip content
- **Model tooltip** — hover over a model name to see description, context length, provider badge, and input/output pricing
- **Comprehensive test suite** — unit, component (jsdom), and Storybook (Playwright) test projects
- **Storybook stories** — Default, PreselectedModel, SystemDefault, CustomPlaceholder, SortByNewest, ControlledFavorites, EmptyState, LoadingState, ErrorState, PopoverTop, WideContainer, DarkMode, MinimalModels, and VeniceLive
- **GitHub Actions CI** — automated npm publish on GitHub release creation
- **TypeScript** — full type exports (33 types):
  - **Base**: `ModelType`, `BaseModel`, `Deprecation`, `AnyModel`
  - **Text**: `TextModel`, `TextPricing`, `TextCapabilities`, `TextConstraints`
  - **Image**: `ImageModel`, `ImagePricing`, `ImageConstraints`
  - **Video**: `VideoModel`, `VideoConstraints`
  - **Inpaint**: `InpaintModel`, `InpaintPricing`, `InpaintConstraints`
  - **Embedding**: `EmbeddingModel`, `EmbeddingPricing`
  - **TTS**: `TtsModel`, `TtsPricing`
  - **ASR**: `AsrModel`, `AsrPricing`
  - **Upscale**: `UpscaleModel`, `UpscalePricing`
  - **Component / Hook**: `ModelSelectorProps`, `TextModelSelectorProps`, `ImageModelSelectorProps`, `VideoModelSelectorProps`, `UseModelsProps`, `UseModelsResult`, `FetchFn`
  - **Normalizer**: `ModelNormalizer`, `ResponseExtractor`
- **Dual CJS/ESM output** — built with tsup, sourcemaps and `.d.ts` included

[Unreleased]: https://github.com/sethbang/open-model-selector/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sethbang/open-model-selector/releases/tag/v0.1.0
