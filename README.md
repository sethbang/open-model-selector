# open-model-selector

[![npm version](https://img.shields.io/npm/v/open-model-selector)](https://www.npmjs.com/package/open-model-selector) [![npm bundle size](https://img.shields.io/bundlephobia/minzip/open-model-selector)](https://bundlephobia.com/package/open-model-selector) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

### An accessible, themeable React model-selector combobox for any OpenAI-compatible API — with first-class [Venice.ai](https://venice.ai) support.


<p align="center">
  <img src="https://raw.githubusercontent.com/sethbang/open-model-selector/main/screenshots/main.png" alt="open-model-selector screenshot showing auto-discovery, code snippet, and the model selector popover" width="50%" />
</p>

> Drop it into your app to let users search, filter, and pick from Venice's frontier model catalog (GPT-5.2, Claude Opus 4.6, Gemini 3 Pro, GLM 4.7, Qwen 3 Coder 480B, and more) or any other `/v1/models` endpoint.
<br />

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [TypeScript](#typescript)
- [Customization](#customization)
- [Framework Integration](#framework-integration)
- [Development](#development)
- [License](#license)
- [Links](#links)

## Features

- **First-class [Venice.ai](https://venice.ai) support** — full normalizer for Venice's rich `model_spec` format including capabilities, privacy levels, traits, and per-type pricing across 60+ models
- **Any OpenAI-compatible endpoint** — also works out of the box with OpenAI, OpenRouter, and more
- **Accessible combobox** built on [cmdk](https://cmdk.paco.me/) + [Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover)
- **Managed or controlled mode** — auto-fetch models from an API, or pass them in directly
- **Fuzzy search** by name, provider, ID, and description
- **Favorites** with `localStorage` persistence or external state control
- **Sorting** by name (A–Z) or newest
- **"Use System Default"** sentinel option for fallback behavior
- **8 model types**: text, image, video, inpaint, embedding, TTS, ASR, upscale
- **Specialized selectors**: `<TextModelSelector>`, `<ImageModelSelector>`, `<VideoModelSelector>`
- **Built-in normalizers** for Venice.ai, OpenAI, and OpenRouter response shapes
- **Scoped CSS** with `--oms-` custom property prefix — never pollutes host styles
- **Dark mode** via `prefers-color-scheme` and `.dark` class
- **Full TypeScript types** exported
- **Dual CJS/ESM output** with sourcemaps
- **React 18 and 19** support

## Installation

### Install the package

```bash
npm install open-model-selector
```

```bash
yarn add open-model-selector
```

```bash
pnpm add open-model-selector
```

### Peer dependencies

The following peer dependencies are required and must be installed separately:

| Package | Version |
| --- | --- |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `@radix-ui/react-popover` | `^1.0.0` |
| `cmdk` | `^1.0.0` |

Install the non-React peer dependencies (React and React DOM are typically already in your project):

```bash
# npm
npm install @radix-ui/react-popover cmdk
# yarn
yarn add @radix-ui/react-popover cmdk
# pnpm
pnpm add @radix-ui/react-popover cmdk
```

> **React 18 users:** React 18 does not bundle its own TypeScript types. If you're using TypeScript with React 18, ensure `@types/react` and `@types/react-dom` are installed in your project.

### CSS import

You must import the stylesheet for the component to render correctly:

```tsx
import "open-model-selector/styles.css";
```

> Import this once in your app's entry point or layout component.

### Node.js requirement

Node.js **>=18.0.0** is required.

---

## Quick Start

### Managed Mode (API Fetch)

The simplest way to use the component — point it at [Venice.ai](https://venice.ai) (or any OpenAI-compatible endpoint) and it handles the rest:

```tsx
import { useState } from "react"
import { ModelSelector } from "open-model-selector"
import type { AnyModel } from "open-model-selector"
import "open-model-selector/styles.css"

function App() {
  const [modelId, setModelId] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<AnyModel | null>(null)

  return (
    <ModelSelector
      baseUrl="https://api.venice.ai/api/v1"
      apiKey="your-api-key"
      value={modelId}
      onChange={(id, model) => {
        setModelId(id)
        setSelectedModel(model) // full model object, or null for system default
      }}
    />
  )
}
```

> The `onChange` callback receives the model ID **and** the full model object (or `null` when "Use System Default" is selected). This eliminates the need for a secondary lookup. The component fetches from `{baseUrl}/models` and normalizes responses automatically. Venice.ai's rich `model_spec` format is fully supported — capabilities, privacy levels, traits, pricing, and deprecation info are all extracted out of the box.

### Controlled Mode (Static Models)

Pass models directly when you already have them or need full control over the list. Here's an example using Venice.ai's frontier models:

```tsx
import { useState } from "react"
import { ModelSelector } from "open-model-selector"
import type { TextModel } from "open-model-selector"
import "open-model-selector/styles.css"

const models: TextModel[] = [
  {
    id: "zai-org-glm-4.7",
    name: "GLM 4.7",
    provider: "venice.ai",
    type: "text",
    created: 1766534400,
    is_favorite: false,
    context_length: 198000,
    capabilities: {
      supportsFunctionCalling: true,
      supportsReasoning: true,
      supportsWebSearch: true,
    },
    pricing: { prompt: 0.00000055, completion: 0.00000265 },
  },
  {
    id: "qwen3-coder-480b-a35b-instruct",
    name: "Qwen 3 Coder 480B",
    provider: "venice.ai",
    type: "text",
    created: 1745903059,
    is_favorite: false,
    context_length: 256000,
    capabilities: {
      optimizedForCode: true,
      supportsFunctionCalling: true,
      supportsWebSearch: true,
    },
    pricing: { prompt: 0.00000075, completion: 0.000003 },
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "venice.ai",
    type: "text",
    created: 1770249600,
    is_favorite: false,
    context_length: 1000000,
    capabilities: {
      optimizedForCode: true,
      supportsFunctionCalling: true,
      supportsReasoning: true,
      supportsVision: true,
    },
    pricing: { prompt: 0.000006, completion: 0.00003 },
  },
]

function App() {
  const [modelId, setModelId] = useState<string>("zai-org-glm-4.7")

  return (
    <ModelSelector
      models={models}
      value={modelId}
      onChange={(id) => setModelId(id)}
      placeholder="Choose a model..."
    />
  )
}
```

> When a non-empty `models` array is provided, the internal API fetch is disabled. Venice.ai offers 60+ models across text, image, video, embedding, TTS, ASR, and more — all accessible via a single API key at [venice.ai](https://venice.ai).

### Specialized Selectors

Type-filtered convenience components for common model categories:

```tsx
import { useState } from "react"
import { TextModelSelector, ImageModelSelector, VideoModelSelector } from "open-model-selector"
import "open-model-selector/styles.css" // Required — same stylesheet as <ModelSelector>

function App() {
  const [model, setModel] = useState("")

  return (
    <>
      {/* These are pre-filtered wrappers around <ModelSelector type="..."> */}
      <TextModelSelector baseUrl="https://api.venice.ai/api/v1" value={model} onChange={(id) => setModel(id)} />
      <ImageModelSelector baseUrl="https://api.venice.ai/api/v1" value={model} onChange={(id) => setModel(id)} />
      <VideoModelSelector baseUrl="https://api.venice.ai/api/v1" value={model} onChange={(id) => setModel(id)} />
    </>
  )
}
```

> These are convenience wrappers that pass `type="text"`, `type="image"`, or `type="video"` respectively. All three forward `ref` to the root `<div>`, just like `<ModelSelector>`.

---

## API Reference

### `<ModelSelector>`

The primary component. Renders an accessible combobox popover for searching and selecting models.

The component forwards `ref` to the root `<div>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `models` | `AnyModel[]` | `[]` | Static list of models. When non-empty, disables internal API fetch. |
| `baseUrl` | `string` | — | Base URL for the OpenAI-compatible API (e.g., `"https://api.venice.ai/api/v1"`). |
| `apiKey` | `string` | — | API key for authentication. ⚠️ Visible in browser DevTools — use a backend proxy in production. |
| `type` | `ModelType` | — | Filter to a specific model type (`"text"`, `"image"`, `"video"`, etc.). |
| `queryParams` | `Record<string, string>` | `{}` | Query parameters appended to the `/models` URL as a query string. See [Query Parameters](#query-parameters) below. |
| `fetcher` | `(url: string, init?: RequestInit) => Promise<Response>` | `fetch` | Custom fetch function for SSR, proxies, or testing. |
| `responseExtractor` | `ResponseExtractor` | `defaultResponseExtractor` | Custom function to extract the model array from the API response. |
| `normalizer` | `ModelNormalizer` | `defaultModelNormalizer` | Custom function to normalize each raw model object into an `AnyModel`. |
| `value` | `string` | — | Currently selected model ID (controlled). |
| `onChange` | `(modelId: string, model: AnyModel \| null) => void` | — | Callback when a model is selected. Receives the model ID and the full model object (or `null` for the system-default sentinel). If omitted, a dev-mode warning is logged. |
| `onToggleFavorite` | `(modelId: string) => void` | — | Callback for favorite toggle. If omitted, favorites use localStorage. |
| `placeholder` | `string` | `"Select model..."` | Placeholder text when no model is selected. |
| `sortOrder` | `"name" \| "created"` | — | Controlled sort order. If omitted, internal state is used. |
| `onSortChange` | `(order: "name" \| "created") => void` | — | Callback when sort changes. |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Popover placement relative to the trigger. |
| `className` | `string` | — | Additional CSS class(es) for the root element. |
| `storageKey` | `string` | `"open-model-selector-favorites"` | localStorage key for persisting favorites (uncontrolled mode). |
| `showSystemDefault` | `boolean` | `true` | Whether to show the "Use System Default" option. |
| `showDeprecated` | `boolean` | `true` | Whether to show deprecated models. When `false`, past-date deprecated models are hidden. |
| `disabled` | `boolean` | `false` | When true, prevents opening the selector and dims the trigger button. |

The library exports a sentinel constant for the system default option:

```ts
import { SYSTEM_DEFAULT_VALUE } from "open-model-selector"
// SYSTEM_DEFAULT_VALUE === "system_default"
```

### `useModels` Hook

Fetches and normalizes models from an OpenAI-compatible API endpoint. Used internally by `<ModelSelector>` but available for building custom UIs on top of Venice.ai or any other provider.

```tsx
import { useModels } from "open-model-selector"

const { models, loading, error } = useModels({
  baseUrl: "https://api.venice.ai/api/v1",
  apiKey: "your-key",
  type: "text",
})
```

#### Props (`UseModelsProps`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `baseUrl` | `string` | — | Base URL for the API. If omitted, no fetch occurs. |
| `apiKey` | `string` | — | Bearer token for authentication. |
| `type` | `ModelType` | — | Client-side filter by model type. |
| `queryParams` | `Record<string, string>` | `{}` | Query parameters appended to the `/models` URL. See [Query Parameters](#query-parameters) below. |
| `fetcher` | `(url: string, init?: RequestInit) => Promise<Response>` | `fetch` | Custom fetch function. |
| `responseExtractor` | `ResponseExtractor` | `defaultResponseExtractor` | Extracts model array from response JSON. |
| `normalizer` | `ModelNormalizer` | `defaultModelNormalizer` | Normalizes each raw model into `AnyModel`. |

#### Return Value (`UseModelsResult`)

| Field | Type | Description |
|-------|------|-------------|
| `models` | `AnyModel[]` | Normalized model array. |
| `loading` | `boolean` | `true` while fetching. |
| `error` | `Error \| null` | Fetch or normalization error, if any. |

> **Notes:**
> - Automatically cleans up with `AbortController` on unmount
> - Re-fetches when `baseUrl`, `apiKey`, or `queryParams` change
> - `fetcher`, `responseExtractor`, and `normalizer` are stored in refs (no memoization needed)

> **⚠️ Stability:** `apiKey` and `baseUrl` are used as React effect dependencies. Ensure these are stable values (string constants, state variables, or `useMemo`'d values). Passing an unstable reference (e.g., `apiKey={computeKey()}`) will cause infinite re-fetching.

### Query Parameters

The `queryParams` prop is appended to the `/models` endpoint URL as query string parameters (e.g., `queryParams={{ type: 'text' }}` fetches from `/models?type=text`).

**Venice.ai users:** Venice's `/models` endpoint supports a `type` parameter to filter models server-side. Pass the model type you need:

```tsx
// Fetch only text models from Venice
<ModelSelector
  baseUrl="https://api.venice.ai/api/v1"
  queryParams={{ type: 'text' }}
  value={model}
  onChange={(id) => setModel(id)}
/>

// Fetch all model types from Venice
<ModelSelector
  baseUrl="https://api.venice.ai/api/v1"
  queryParams={{ type: 'all' }}
  value={model}
  onChange={(id) => setModel(id)}
/>
```

> Venice supports `type` values: `"text"`, `"image"`, `"video"`, `"embedding"`, `"tts"`, `"asr"`, `"upscale"`, `"inpaint"`, and `"all"`.

**Other APIs:** Pass whatever query parameters your endpoint expects, or omit `queryParams` entirely if none are needed.

> **Performance tip:** The `type` prop (e.g., `type="text"`) filters **client-side** — all models are fetched first, then filtered in the browser. For large catalogs, use `queryParams` to filter **server-side** at the API level, reducing payload size and parse time. You can combine both: `queryParams` for server-side pre-filtering and `type` as a client-side safety net.

### Model Types

The library supports 8 model types, each with its own TypeScript interface extending `BaseModel`:

| Type | Interface | Key Fields |
|------|-----------|------------|
| `"text"` | `TextModel` | `pricing.prompt`, `pricing.completion`, `pricing.cache_input`, `pricing.cache_write`, `context_length`, `capabilities`, `constraints.temperature`, `constraints.top_p` |
| `"image"` | `ImageModel` | `pricing.generation`, `pricing.resolutions`, `constraints.aspectRatios`, `constraints.resolutions`, `supportsWebSearch` |
| `"video"` | `VideoModel` | `constraints.resolutions`, `constraints.durations`, `constraints.aspect_ratios`, `model_sets` |
| `"inpaint"` | `InpaintModel` | `pricing.generation`, `constraints.aspectRatios`, `constraints.combineImages` |
| `"embedding"` | `EmbeddingModel` | `pricing.input`, `pricing.output` |
| `"tts"` | `TtsModel` | `pricing.input`, `voices` |
| `"asr"` | `AsrModel` | `pricing.per_audio_second` |
| `"upscale"` | `UpscaleModel` | `pricing.generation` |

The union type `AnyModel` represents any of the above.

The `BaseModel` interface includes these fields shared by all types:

- `id: string`
- `name: string`
- `provider: string`
- `created: number` (Unix timestamp)
- `type: ModelType`
- `description?: string`
- `privacy?: "private" | "anonymized"`
- `is_favorite?: boolean`
- `offline?: boolean`
- `betaModel?: boolean`
- `modelSource?: string`
- `traits?: string[]`
- `deprecation?: { date: string }`

```tsx
import type { TextModel, ImageModel, AnyModel, ModelType } from "open-model-selector"
```

The library also exports prop types for each specialized selector:

```tsx
import type {
  ModelSelectorProps,
  TextModelSelectorProps,
  ImageModelSelectorProps,
  VideoModelSelectorProps,
} from "open-model-selector"
```

> `TextModelSelectorProps`, `ImageModelSelectorProps`, and `VideoModelSelectorProps` are each `Omit<ModelSelectorProps, 'type'>` — identical to `ModelSelectorProps` with the `type` prop removed.

---

## TypeScript

Full `.d.ts` type declarations are included in the package — no separate `@types/` install is needed.

### All Exported Types

```ts
// Component props
import type {
  ModelSelectorProps,
  TextModelSelectorProps,
  ImageModelSelectorProps,
  VideoModelSelectorProps,
} from "open-model-selector"

// Hook types
import type { UseModelsProps, UseModelsResult, FetchFn } from "open-model-selector"

// Base model types
import type { ModelType, BaseModel, Deprecation, AnyModel } from "open-model-selector"

// Text model types
import type { TextModel, TextPricing, TextCapabilities, TextConstraints } from "open-model-selector"

// Image model types
import type { ImageModel, ImagePricing, ImageConstraints } from "open-model-selector"

// Video model types
import type { VideoModel, VideoConstraints } from "open-model-selector"

// Other model types
import type { InpaintModel, InpaintPricing, InpaintConstraints } from "open-model-selector"
import type { EmbeddingModel, EmbeddingPricing } from "open-model-selector"
import type { TtsModel, TtsPricing } from "open-model-selector"
import type { AsrModel, AsrPricing } from "open-model-selector"
import type { UpscaleModel, UpscalePricing } from "open-model-selector"

// Normalizer types (also available from "open-model-selector/utils")
import type { ModelNormalizer, ResponseExtractor } from "open-model-selector"
```

> **Tip:** `import type` statements are erased at compile time and are always safe in React Server Components, regardless of `"use client"` directives.

---

## Customization

### Custom Normalizer

The built-in `defaultModelNormalizer` handles Venice.ai, OpenAI, and OpenRouter response shapes automatically — including Venice's nested `model_spec` format with capabilities, privacy, traits, and deprecation info. If your API returns a different shape, provide a custom normalizer:

```tsx
import { ModelSelector } from "open-model-selector"
import type { ModelNormalizer, AnyModel } from "open-model-selector"

const myNormalizer: ModelNormalizer = (raw): AnyModel => ({
  id: raw.model_id as string,
  name: raw.display_name as string,
  provider: raw.org as string,
  type: "text",
  created: Date.now() / 1000,
  is_favorite: false,
  context_length: Number(raw.max_tokens) || 128000,
  pricing: {
    prompt: Number(raw.cost_per_input_token),
    completion: Number(raw.cost_per_output_token),
  },
})

<ModelSelector
  baseUrl="https://my-api.com/v1"
  normalizer={myNormalizer}
  value={model}
  onChange={(id) => setModel(id)}
/>
```

> You can also compose with the built-in `extractBaseFields` helper for shared fields. The normalizer is stored in a ref — no `useCallback` wrapper needed.

### Custom Response Extractor

The built-in `defaultResponseExtractor` handles `{ data: [...] }`, `{ models: [...] }`, and top-level arrays. For non-standard response shapes, provide a custom extractor:

```tsx
import type { ResponseExtractor } from "open-model-selector"

const myExtractor: ResponseExtractor = (body) => {
  // Your API returns { results: { items: [...] } }
  const results = (body as any).results
  return results?.items ?? []
}

<ModelSelector
  baseUrl="https://my-api.com/v1"
  responseExtractor={myExtractor}
  value={model}
  onChange={(id) => setModel(id)}
/>
```

### Styling and Theming

All CSS variables are scoped under `.oms-reset` and use the `--oms-` prefix — they never pollute `:root` or the host app.

**Overriding variables:**

```css
.oms-reset {
  --oms-primary: 210 100% 50%;
  --oms-radius: 0.75rem;
  --oms-popover-width: 400px;
}
```

**Key CSS variables:**

| Variable | Default (Light) | Purpose |
|----------|----------------|---------|
| `--oms-background` | `0 0% 100%` | Background color |
| `--oms-foreground` | `222.2 84% 4.9%` | Text color |
| `--oms-primary` | `222.2 47.4% 11.2%` | Primary/action color |
| `--oms-accent` | `210 40% 96.1%` | Hover/selection highlight |
| `--oms-muted-foreground` | `215.4 16.3% 46.9%` | Subdued text |
| `--oms-border` | `214.3 31.8% 91.4%` | Border color |
| `--oms-destructive` | `0 84.2% 60.2%` | Error/destructive color |
| `--oms-radius` | `0.5rem` | Border radius |
| `--oms-popover-width` | `300px` | Popover width |

> **Important:** CSS variable values must be space-separated HSL triplets (e.g., `220 14% 96%`), **not** hex, rgb, or named colors. The component uses these values inside `hsl()` wrappers internally, following the Shadcn/ui convention. This allows alpha composition: `hsl(var(--oms-accent) / 0.5)`.
>
> ```css
> /* ✅ Correct */
> .my-theme .oms-popover-content {
>   --oms-background: 220 14% 96%;
> }
>
> /* ❌ Incorrect — will break styling */
> .my-theme .oms-popover-content {
>   --oms-background: #f0f0f0;
>   --oms-background: rgb(240, 240, 240);
>   --oms-background: white;
> }
> ```

**Dark mode:**

The component supports two dark mode strategies:

1. **Automatic** — `@media (prefers-color-scheme: dark)` works out of the box with no configuration.
2. **Class-based** — Add a `.dark` class to any ancestor element. Compatible with Tailwind's `darkMode: "class"`.

```html
<!-- Automatic: just works with OS dark mode -->
<ModelSelector ... />

<!-- Manual: add .dark class to any ancestor -->
<div class="dark">
  <ModelSelector ... />
</div>
```

> Portal-safe — the dark theme is also applied to popover and tooltip content that renders outside the component tree via Radix portals.

### Format Utilities

The `open-model-selector/utils` entry point exports format utilities without the `"use client"` directive, making them safe for React Server Components:

```tsx
import {
  formatPrice,
  formatContextLength,
  formatFlatPrice,
  formatAudioPrice,
  formatDuration,
  formatResolutions,
  formatAspectRatios,
} from "open-model-selector/utils"
```

Usage examples:

```ts
formatPrice("0.000003")       // "$3.00"  — per-token price × 1,000,000
formatPrice(0.00003)           // "$30.00" — works with numbers too
formatPrice(0)                 // "Free"
formatPrice(undefined)         // "—"
formatContextLength(128000)    // "128k"
formatFlatPrice(0.04)          // "$0.04"
formatAudioPrice(0.006)        // "$0.0060 / sec"
formatDuration(["5", "10"])    // "5s – 10s"
formatResolutions(["720p", "1080p", "4K"])  // "720p, 1080p, 4K"
formatAspectRatios(["1:1", "16:9", "4:3"]) // "1:1, 16:9, 4:3"
```

> **Note:** `formatPrice` expects the raw **per-token** price (as returned by OpenAI, Venice.ai, OpenRouter, etc.) and converts it to a **per-million-token** display value by multiplying by 1,000,000. For example, a per-token cost of `0.000003` becomes `$3.00` per million tokens. Very small values (< $0.01/M) use 6 decimal places to preserve precision.

### Normalizer Utilities

In addition to `defaultModelNormalizer` and `defaultResponseExtractor`, the library exports the individual per-type normalizers, type inference helpers, and low-level building blocks. These are available from both `"open-model-selector"` and `"open-model-selector/utils"`.

#### Per-Type Normalizers

Each model type has a dedicated normalizer that converts a raw API response object into the corresponding typed model:

```ts
import {
  normalizeTextModel,
  normalizeImageModel,
  normalizeVideoModel,
  normalizeInpaintModel,
  normalizeEmbeddingModel,
  normalizeTtsModel,
  normalizeAsrModel,
  normalizeUpscaleModel,
} from "open-model-selector/utils"

// Each accepts a raw object and returns the typed model
const textModel = normalizeTextModel(rawApiObject)   // → TextModel
const imageModel = normalizeImageModel(rawApiObject) // → ImageModel
```

> These are the same functions used internally by `defaultModelNormalizer`. Use them directly when you need to normalize models of a known type without the dispatching logic.

| Function | Returns |
|----------|---------|
| `normalizeTextModel(raw)` | `TextModel` |
| `normalizeImageModel(raw)` | `ImageModel` |
| `normalizeVideoModel(raw)` | `VideoModel` |
| `normalizeInpaintModel(raw)` | `InpaintModel` |
| `normalizeEmbeddingModel(raw)` | `EmbeddingModel` |
| `normalizeTtsModel(raw)` | `TtsModel` |
| `normalizeAsrModel(raw)` | `AsrModel` |
| `normalizeUpscaleModel(raw)` | `UpscaleModel` |

#### Type Inference

`inferTypeFromId` uses heuristic pattern matching on a model's ID string to determine its type. This is how `defaultModelNormalizer` classifies models from providers that don't include an explicit `type` field (e.g., OpenAI, OpenRouter):

```ts
import { inferTypeFromId, MODEL_ID_TYPE_PATTERNS } from "open-model-selector/utils"

inferTypeFromId("dall-e-3")           // "image"
inferTypeFromId("whisper-large-v3")   // "asr"
inferTypeFromId("gpt-4o")            // undefined (no match → caller defaults to "text")
```

`MODEL_ID_TYPE_PATTERNS` is the `Array<[RegExp, ModelType]>` used internally. It's exported so you can inspect the built-in rules or extend them for custom providers.

#### Low-Level Helpers

| Function | Signature | Description |
|----------|-----------|-------------|
| `extractBaseFields` | `(raw, type) → Omit<BaseModel, 'type'>` | Extracts shared `BaseModel` fields from a raw API object. Handles both Venice's nested `model_spec` format and flat top-level fields. Useful when writing custom per-type normalizers. |
| `toNum` | `(v: unknown) → number \| undefined` | Safely coerces an unknown value to a number. Returns `undefined` for `undefined`, `null`, empty strings, and `NaN`. Used internally by all normalizers. |

### Helper Utilities

These are exported from `"open-model-selector/utils"` (and also re-exported from the main entry):

```ts
import { isDeprecated } from "open-model-selector/utils"
// or equivalently:
import { isDeprecated } from "open-model-selector"
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `isDeprecated` | `(dateStr: string) → boolean` | Returns `true` if the given ISO 8601 date string is in the past. Handles date-only strings (`"2025-01-15"`) by normalizing to UTC. Returns `false` for invalid dates. |

---

## Framework Integration

### `"use client"` & React Server Components

All component and hook modules include a `"use client"` directive — they are safe to import in Next.js App Router, Remix, and other RSC-aware frameworks without extra wrappers.

The **`open-model-selector/utils`** sub-path does **not** include `"use client"` and is safe to import directly in Server Components:

```tsx
// ✅ Server Component — works fine
import { formatPrice, formatContextLength } from "open-model-selector/utils"

// ✅ Server Component — type-only imports are always safe
import type { TextModel, AnyModel } from "open-model-selector"
```

If you need the components or `useModels` hook, import them in a Client Component (any file with `"use client"` at the top, or rendered inside one).

### SSR Compatibility

The library is SSR-safe:

- An isomorphic `useLayoutEffect` pattern is used internally, so there are no React warnings during server-side rendering.
- Works with **Next.js** (App Router and Pages Router), **Remix**, **Gatsby**, and any other SSR framework.
- Tooltips render via a `createPortal` call — they require a DOM environment, but this is handled automatically since the portal only mounts after hydration.

### Security

- **API keys** are sent as an `Authorization: Bearer` header, never as URL query parameters.
- **Error messages** from failed requests are constructed from `response.status` and `response.statusText` only — user-supplied content is not interpolated into the DOM.
- **Client-side key exposure:** Any `apiKey` passed as a prop is visible in browser DevTools. For production apps, use one of:
  - A server-side proxy that injects the key (pass a relative `baseUrl` and a custom `fetcher`)
  - Environment variables scoped to the server (e.g., `VENICE_API_KEY`) with a thin API route
  - A scoped/read-only API key with minimal permissions

#### Recommended: Backend Proxy Pattern

Instead of passing `apiKey` directly, use a server-side proxy and the `fetcher` prop:

```tsx
// Next.js API Route: app/api/models/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.venice.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${process.env.VENICE_API_KEY}` },
  })
  return NextResponse.json(await res.json())
}
```

```tsx
// Client component
<ModelSelector
  baseUrl="/api"
  fetcher={(url, init) => fetch(url, init)}
  onChange={(id) => console.log(id)}
/>
```

This keeps your API key server-side and never exposes it to the browser.

### Accessibility

The component implements the [ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) and is designed to work well with screen readers and keyboard-only navigation.

**Combobox & Popover:**
- Trigger button has `role="combobox"` with `aria-expanded`, `aria-haspopup="listbox"`, and `aria-controls` linking to the listbox
- Dynamic `aria-label` reflects the current selection state
- Search input is labeled (`aria-label="Search models"`)
- Loading state uses `role="status"` with `aria-live="polite"`; errors use `role="alert"`

**Keyboard Navigation** (provided by [cmdk](https://cmdk.paco.me/) and [Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover)):
- `↑` / `↓` — navigate the model list
- `Enter` — select the highlighted model
- `Escape` — close the popover and return focus to the trigger
- Type-ahead filtering via the search input (auto-focused on open)

**Tooltips:**
- Model detail tooltips use `role="tooltip"` with a unique `id` linked via `aria-describedby` on the trigger
- Tooltips appear on both hover and keyboard focus (`onFocus` / `onBlur`), and dismiss with `Escape`

---

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build with tsup (CJS + ESM + types + sourcemaps). Cleans `dist/` first via `prebuild`. |
| `npm run dev` | Build in watch mode for development. |
| `npm run typecheck` | Run TypeScript type checking (`tsc`). |
| `npm test` | Run tests with Vitest. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run storybook` | Start Storybook dev server on port 6006. |
| `npm run build-storybook` | Build static Storybook site. |

> `npm run prepublishOnly` runs typecheck → test → build automatically before publishing.

### Testing

The project uses a layered testing strategy:

- **Unit tests**: Vitest with jsdom environment
- **Component tests**: `@testing-library/react` + `@testing-library/user-event`
- **Browser tests**: Storybook + Playwright via `@storybook/addon-vitest` and `@vitest/browser-playwright`

Test files:

- [`src/components/model-selector.test.tsx`](src/components/model-selector.test.tsx) — Component tests
- [`src/hooks/use-models.test.tsx`](src/hooks/use-models.test.tsx) — Hook tests
- [`src/utils/format.test.ts`](src/utils/format.test.ts) — Format utility tests
- [`src/utils/normalizers/normalizers.test.ts`](src/utils/normalizers/normalizers.test.ts) — Normalizer tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Storybook

The project includes comprehensive Storybook stories covering multiple scenarios: Default, PreselectedModel, SystemDefault, CustomPlaceholder, SortByNewest, ControlledFavorites, EmptyState, LoadingState, ErrorState, PopoverTop, WideContainer, DarkMode, MinimalModels, and VeniceLive.

```bash
npm run storybook
# Opens at http://localhost:6006
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `npm run typecheck && npm test` to verify
5. Commit and push
6. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Links

- [npm](https://www.npmjs.com/package/open-model-selector)
- [GitHub](https://github.com/sethbang/open-model-selector)
- [Changelog](CHANGELOG.md)
- [Issues](https://github.com/sethbang/open-model-selector/issues)
- [Venice.ai](https://venice.ai) — recommended OpenAI-compatible API provider, offering both frontier models and open source models.
