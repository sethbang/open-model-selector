# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] — 2026-04-20

### Added

- **In-menu type filter chip** — when the catalog contains 2+ model types and the `type` prop is unset, a "Filter" chip appears next to the sort button. Click to narrow the list to one type. New props: `typeFilter`, `onTypeFilterChange`, `showTypeFilter`.
- **Strict coercion helpers** — `toBool`, `toStr`, `toStrArray` alongside `toNum`. Used internally to replace unsafe `as` casts throughout the normalizers; exported from both `"open-model-selector"` and `"open-model-selector/utils"`.
- **Venice `supportsMultipleImages`** — added to `TextCapabilities`; extracted from `model_spec.capabilities`.
- **Lint + format + pre-commit tooling** — ESLint 9 (flat config, typescript-eslint + react-hooks + jsx-a11y), Prettier, Husky + lint-staged. `npm run lint` is a new CI gate.

### Fixed

- **OpenRouter cache pricing no longer silently dropped** — `normalizeTextModel` now reads OpenRouter's `input_cache_read` and `input_cache_write` fields in addition to `cache_input`/`cache_write`.
- **Capability fields reject non-boolean shapes** — an API response like `{ supportsVision: { enabled: true } }` now resolves to `undefined` instead of being cast to `true`.
- **Sort button ARIA** — `aria-label` describes the current sort state (not the next action); `aria-pressed` reflects whether "newest" is active.
- **Pill contrast** — capability pills (vision/reasoning/code/etc.) now meet WCAG AA in both light and dark mode.
- **Dark-mode tooltip portal** — `.oms-hover-content` gets explicit dark-mode overrides (background/border/shadow) in both media-query and class-based dark mode.
- **Reduced-motion spinner** — the loading spinner pulses instead of rotating when `prefers-reduced-motion: reduce`.

### Changed

- **BREAKING: `TextModel.context_length` is now `number | undefined`** — previously the field defaulted to `0` when no context-length source resolved, which was indistinguishable from a model with genuinely zero context. Now `undefined` signals "unknown". Consumers doing `if (model.context_length > 0)` are unaffected; anything branching on `=== 0` will need to handle `undefined`.
- Icons in `icons.tsx` default to `aria-hidden="true"` (overridable via props).
- `<ModelSelector>` warns in dev mode when rendered with neither `models` nor `baseUrl`.
- `now` reference for deprecation filtering is captured once at mount (was refreshed on every popover open — caused memo cascades).
- `handleModelSelect` reads from a live ref so its identity is stable across favorite toggles. `ModelItem`'s custom memo comparator works again.
- tsup no longer emits a no-op `"use client"` banner on the CJS build (ESM still gets it; esbuild places the CJS banner after the runtime preamble where it has no effect).
- CI runs `npm run test:coverage` — thresholds (70% statements/functions/lines, 65% branches) now actually gate PRs. Baseline: 95.79 / 90.36 / 96.09 / 98.3.

## [0.2.0] — 2026-02-20

### Added

- **Multi-provider type resolution** — `defaultModelNormalizer` now uses a 6-tier classification strategy to correctly identify model types across providers that use non-standard vocabulary:
  1. Direct match against canonical types (Venice)
  2. Non-text alias mapping (Together AI: `"audio"`→`"tts"`, `"transcribe"`→`"asr"`)
  3. Architecture-based inference from `output_modalities` (OpenRouter)
  4. Heuristic inference from model ID patterns
  5. Text-aliased type (Together AI: `"chat"`→`"text"`, Mistral: `"base"`→`"text"`, Vercel: `"language"`→`"text"`)
  6. Default to `"text"`
- **`TYPE_ALIASES` export** — maps provider-specific type strings (`chat`, `language`, `base`, `moderation`, `rerank`, `audio`, `transcribe`) to canonical `ModelType` values; exported from both `"open-model-selector"` and `"open-model-selector/utils"` so consumers can inspect or extend
- **Extended `MODEL_ID_TYPE_PATTERNS`** — new heuristic patterns: `embedqa`, `imagen`, `gpt-image`, `image-preview`, `kling`
- **Provider compatibility test suite** (`provider-compat.test.ts`) — 418 lines covering type resolution for Together AI, Vercel AI Gateway, Mistral AI, OpenRouter, OpenAI, Nvidia NIM, Helicone, and Venice AI response shapes, plus `defaultResponseExtractor` wrapper shapes
- **Live provider Storybook stories** (`provider-live.stories.tsx`) — interactive stories for testing against 12 real provider APIs: OpenAI, OpenRouter, Together, Groq, Cerebras, Nvidia, Mistral, DeepSeek, SambaNova, Venice, Helicone, and Vercel
- **`.env.example`** — environment variable template for 13 API provider keys used by Storybook live stories and the snapshot capture script
- **Provider snapshot capture script** (`scripts/capture-provider-snapshots.cjs`) — fetches and stores real provider API responses for test fixture generation
- **`.env` parser utility** (`scripts/parse-env.cjs`) — shared `.env` file parser used by both Storybook config and the snapshot capture script
- **Storybook provider proxy support** — `.storybook/main.ts` now loads `.env` keys and configures Vite proxies for cross-origin provider API access during development

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

[Unreleased]: https://github.com/sethbang/open-model-selector/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/sethbang/open-model-selector/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/sethbang/open-model-selector/releases/tag/v0.1.0
