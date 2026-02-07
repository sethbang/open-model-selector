# open-model-selector

A generic, OpenAI-compatible model selector component for React — with **native support for the [Venice.ai](https://venice.ai) model list spec**. Drop it into any app to let users browse, search, favorite, and select AI models from Venice.ai, OpenAI, OpenRouter, or any OpenAI-compatible API — or from a static list you provide.

Built with [cmdk](https://cmdk.paco.me/) and [Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover). Zero global styles. Dark mode out of the box.

## Features

- **Venice.ai native** — first-class support for the Venice.ai model spec including `model_spec` fields, context tokens, per-million pricing, and rich metadata
- **OpenAI-compatible** — works with Venice.ai, OpenAI, OpenRouter, and any `/v1/models` endpoint
- **Two modes** — fetch models from an API (_managed_), or pass a static array (_controlled_)
- **Search** — fuzzy search by name, provider, ID, or description (powered by cmdk)
- **Favorites** — star models to pin them to the top; persists to `localStorage` or controlled externally
- **Sorting** — toggle between alphabetical (A-Z) and newest-first
- **System Default** — optional "Use System Default" sentinel option
- **Dark mode** — supports `prefers-color-scheme` and class-based (`.dark`) dark mode
- **Scoped styles** — all CSS variables use `--oms-` prefix; never pollutes `:root`
- **RSC-safe utils** — import normalizers and formatters from `open-model-selector/utils` in Server Components
- **Accessible** — ARIA combobox pattern, screen reader labels, keyboard navigation
- **Custom normalizers** — plug in your own response extractor or model normalizer for exotic APIs
- **Custom fetcher** — inject a fetch function for SSR, proxies, or testing (no memoization needed)
- **Lightweight** — peer deps only; no bundled UI framework

## Venice.ai Model Showcase

Out of the box, the component understands the Venice.ai model list format — including `model_spec.name`, `model_spec.availableContextTokens`, `model_spec.pricing`, `model_spec.description`, and `model_spec.capabilities`. Just point `baseUrl` at Venice.ai and you're done:

```tsx
<ModelSelector
  baseUrl="https://api.venice.ai/api/v1"
  value={modelId}
  onChange={setModelId}
/>
```

No API key required for model discovery. Venice.ai offers a wide array of state-of-the-art models across text, image, video, and more:

### Text Models — State of the Art

| Model | ID | Context | Capabilities | Pricing (per 1M tokens) |
| --- | --- | --- | --- | --- |
| **GLM 4.7** | `zai-org-glm-4.7` | 198K | Reasoning, Function Calling, Web Search | $0.55 in / $2.65 out |
| **Qwen 3 235B Thinking** | `qwen3-235b-a22b-thinking-2507` | 128K | Reasoning, Function Calling, Web Search | $0.45 in / $3.50 out |
| **Qwen 3 Coder 480B** | `qwen3-coder-480b-a35b-instruct` | 256K | Code-optimized, Function Calling | $0.75 in / $3.00 out |
| **Qwen3 VL 235B** | `qwen3-vl-235b-a22b` | 256K | Vision, Function Calling, Web Search | $0.25 in / $1.50 out |
| **Venice Medium** | `mistral-31-24b` | 128K | Vision, Function Calling, Web Search | $0.50 in / $2.00 out |
| **Venice Small** | `qwen3-4b` | 32K | Fastest, Reasoning, Function Calling | $0.05 in / $0.15 out |
| **Venice Uncensored 1.1** | `venice-uncensored` | 32K | Uncensored, Web Search | $0.20 in / $0.90 out |

### Frontier Models via Venice.ai

Venice.ai also provides access to frontier proprietary models through a unified API:

| Model | ID | Context | Pricing (per 1M tokens) |
| --- | --- | --- | --- |
| **Claude Opus 4.6** | `claude-opus-4-6` | 1M | $6.00 in / $30.00 out |
| **Claude Opus 4.5** | `claude-opus-45` | 198K | $6.00 in / $30.00 out |
| **GPT-5.2** | `openai-gpt-52` | 256K | $2.19 in / $17.50 out |
| **Gemini 3 Pro Preview** | `gemini-3-pro-preview` | 198K | $2.50 in / $15.00 out |
| **Gemini 3 Flash Preview** | `gemini-3-flash-preview` | 256K | $0.70 in / $3.75 out |
| **Grok 4.1 Fast** | `grok-41-fast` | 256K | $0.50 in / $1.25 out |
| **Kimi K2 Thinking** | `kimi-k2-thinking` | 256K | $0.75 in / $3.20 out |
| **DeepSeek V3.2** | `deepseek-v3.2` | 160K | $0.40 in / $1.00 out |
| **MiniMax M2.1** | `minimax-m21` | 198K | $0.40 in / $1.60 out |

> All Venice.ai models are automatically normalized by the built-in `defaultModelNormalizer` — including context length from `model_spec.availableContextTokens`, display name from `model_spec.name`, description from `model_spec.description`, and per-token pricing converted from Venice.ai's per-million format.

## Installation

```bash
npm install open-model-selector @radix-ui/react-popover cmdk
```

### Peer Dependencies

| Package | Version |
| --- | --- |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `@radix-ui/react-popover` | `^1.0.0` |
| `cmdk` | `^1.0.0` |

## Quick Start

Import the component and the stylesheet:

```tsx
import { ModelSelector } from "open-model-selector"
import "open-model-selector/styles.css"
```

### Managed Mode — Fetch from an API

Point `baseUrl` at any OpenAI-compatible endpoint. The component fetches `/models`, normalizes the response, and renders the selector:

```tsx
import { useState } from "react"
import { ModelSelector } from "open-model-selector"
import "open-model-selector/styles.css"

function App() {
  const [modelId, setModelId] = useState("")

  return (
    <ModelSelector
      baseUrl="https://api.venice.ai/api/v1"
      value={modelId}
      onChange={setModelId}
    />
  )
}
```

If the API requires authentication:

```tsx
<ModelSelector
  baseUrl="https://api.venice.ai/api/v1"
  apiKey="your-venice-api-key"
  value={modelId}
  onChange={setModelId}
/>
```

> **Warning:** `apiKey` is visible in browser DevTools. For production, use a backend proxy and the `fetcher` prop instead.

### Controlled Mode — Static Models

Pass a `models` array directly. The internal fetch is disabled:

```tsx
import { ModelSelector } from "open-model-selector"
import type { Model } from "open-model-selector"
import "open-model-selector/styles.css"

const models: Model[] = [
  {
    id: "zai-org-glm-4.7",
    name: "GLM 4.7",
    provider: "venice.ai",
    created: 1766534400,
    context_length: 198000,
    description: "Strong reasoning capabilities with the largest context window for detailed analysis.",
    pricing: { prompt: "0.00000055", completion: "0.00000265" },
    is_favorite: false,
  },
  {
    id: "qwen3-235b-a22b-thinking-2507",
    name: "Qwen 3 235B A22B Thinking 2507",
    provider: "venice.ai",
    created: 1745903059,
    context_length: 128000,
    description: "Built for in-depth research and high-precision tasks.",
    pricing: { prompt: "0.00000045", completion: "0.0000035" },
    is_favorite: false,
  },
  {
    id: "qwen3-coder-480b-a35b-instruct",
    name: "Qwen 3 Coder 480B",
    provider: "venice.ai",
    created: 1745903059,
    context_length: 256000,
    description: "Optimized for code generation and software engineering.",
    pricing: { prompt: "0.00000075", completion: "0.000003" },
    is_favorite: false,
  },
]

function App() {
  const [modelId, setModelId] = useState("")
  return <ModelSelector models={models} value={modelId} onChange={setModelId} />
}
```

## API Reference

### `<ModelSelector>`

A fully accessible combobox for selecting an AI model. Supports `React.forwardRef`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `models` | `Model[]` | `[]` | Static list of models. Disables API fetch when non-empty. |
| `baseUrl` | `string` | — | Base URL for the OpenAI-compatible API (e.g. `"https://api.venice.ai/api/v1"`). |
| `apiKey` | `string` | — | Bearer token for API authentication. |
| `fetcher` | `(url: string, init?: RequestInit) => Promise<Response>` | `fetch` | Custom fetch function. Stored in a ref — no memoization needed. |
| `responseExtractor` | `ResponseExtractor` | `defaultResponseExtractor` | Extracts the raw model array from the API response body. |
| `normalizer` | `ModelNormalizer` | `defaultModelNormalizer` | Transforms each raw model object into a `Model`. |
| `value` | `string` | — | Currently selected model ID (controlled). |
| `onChange` | `(modelId: string) => void` | — | Fired when a model is selected. Omit for read-only display. |
| `onToggleFavorite` | `(modelId: string) => void` | — | Controlled favorites handler. Without this, favorites persist to `localStorage`. |
| `placeholder` | `string` | `"Select model..."` | Placeholder text when no model is selected. |
| `sortOrder` | `"name" \| "created"` | — | Controlled sort order. Without this, sort is managed internally. |
| `onSortChange` | `(order: "name" \| "created") => void` | — | Fired when sort order changes (controlled mode). |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Popover placement relative to the trigger. |
| `className` | `string` | — | Additional CSS class(es) for the root element. |
| `storageKey` | `string` | `"open-model-selector-favorites"` | `localStorage` key for uncontrolled favorites. |
| `showSystemDefault` | `boolean` | `true` | Whether to show the "Use System Default" option. |

### `SYSTEM_DEFAULT_VALUE`

Sentinel string constant (`"system_default"`) representing the system default selection. Use this to check whether the user selected "Use System Default":

```tsx
import { SYSTEM_DEFAULT_VALUE } from "open-model-selector"

if (value === SYSTEM_DEFAULT_VALUE) {
  // user chose system default
}
```

### `useOpenAIModels(props)`

React hook that fetches and normalizes models from an OpenAI-compatible API.

```tsx
import { useOpenAIModels } from "open-model-selector"

const { models, loading, error } = useOpenAIModels({
  baseUrl: "https://api.venice.ai/api/v1",
})
```

#### Props (`UseOpenAIModelsProps`)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | — | API base URL. When falsy, returns empty models. |
| `apiKey` | `string` | — | Bearer token for authentication. |
| `fetcher` | `(url, init?) => Promise<Response>` | `fetch` | Custom fetch function (ref-stored, no memo needed). |
| `responseExtractor` | `ResponseExtractor` | `defaultResponseExtractor` | Extracts raw model array from API response. |
| `normalizer` | `ModelNormalizer` | `defaultModelNormalizer` | Normalizes each raw model into a `Model`. |

#### Returns (`UseOpenAIModelsResult`)

| Field | Type | Description |
| --- | --- | --- |
| `models` | `Model[]` | Normalized model array. |
| `loading` | `boolean` | `true` while fetching. |
| `error` | `Error \| null` | Error object if the fetch failed. |

### `Model` Interface

```ts
interface Model {
  id: string            // Unique model identifier (e.g. "zai-org-glm-4.7", "openai-gpt-52", "anthropic/claude-opus-4-6")
  name: string          // Display name
  provider: string      // Provider (extracted from ID prefix, owned_by, or "Unknown")
  created: number       // Unix timestamp
  description?: string  // Optional model description
  context_length: number // Max context window in tokens
  pricing: ModelPricing // Per-token pricing info
  is_favorite: boolean  // Whether the model is favorited
}

interface ModelPricing {
  prompt?: string | number      // Price per input token
  completion?: string | number  // Price per output token
  [key: string]: unknown        // Extensible for other pricing fields
}
```

### Utility Functions

Import from `open-model-selector/utils` for RSC-safe usage (no `"use client"` directive):

```ts
import {
  defaultModelNormalizer,
  defaultResponseExtractor,
  formatPrice,
  formatContextLength,
} from "open-model-selector/utils"
```

#### `defaultResponseExtractor(body)`

Extracts the model array from common API response shapes:
- `body.data` — OpenAI standard (also used by Venice.ai)
- `body.models` — alternative shape
- `body` itself — if the response is already an array

#### `defaultModelNormalizer(raw)`

Normalizes a raw model object from any of these formats:
- **Venice.ai** — `model_spec.name`, `model_spec.availableContextTokens`, `model_spec.pricing`, `model_spec.description`, `model_spec.capabilities`
- **OpenAI** — `id`, `name`, `owned_by`, `context_length`, `pricing`
- **OpenRouter** — slash-separated `id` (`"anthropic/claude-3-opus"`), `context_length`, `pricing`

Venice.ai's `model_spec.pricing` uses per-million-tokens format (e.g., `{ input: { usd: 0.55 } }` = $0.55/1M tokens). The normalizer automatically converts this to per-token pricing for consistent display via `formatPrice()`.

#### `formatPrice(value)`

Formats a per-token price into a per-million-tokens dollar string:

```ts
formatPrice(0.00003)    // "$30.00"
formatPrice("0.000015") // "$15.00"
formatPrice(1e-12)      // "$0.000001"
formatPrice(undefined)  // "—"
```

#### `formatContextLength(tokens)`

Formats a token count into a compact string:

```ts
formatContextLength(128000)    // "128k"
formatContextLength(1_000_000) // "1M"
formatContextLength(1_500_000) // "1.5M"
formatContextLength(500)       // "500"
```

## Customization

### Custom Normalizer

Override model normalization for APIs with non-standard shapes:

```tsx
import { ModelSelector, defaultModelNormalizer } from "open-model-selector"

<ModelSelector
  baseUrl="https://my-api.com/v1"
  normalizer={(raw) => ({
    ...defaultModelNormalizer(raw),
    provider: (raw.vendor as string) ?? "custom",
  })}
  value={value}
  onChange={setValue}
/>
```

### Custom Response Extractor

Handle APIs whose response body doesn't follow `{ data: [...] }`:

```tsx
<ModelSelector
  baseUrl="https://my-api.com/v1"
  responseExtractor={(body) => (body as any).results.items}
  value={value}
  onChange={setValue}
/>
```

### Custom Fetcher

Inject credentials, headers, or use a backend proxy:

```tsx
<ModelSelector
  baseUrl="https://api.venice.ai/api/v1"
  fetcher={(url, init) => fetch(url, { ...init, credentials: "include" })}
  value={value}
  onChange={setValue}
/>
```

> **Note:** `fetcher`, `responseExtractor`, and `normalizer` are stored in refs internally. You can pass inline functions — no `useCallback` required.

### Controlled Favorites

Manage favorites externally (e.g. in a database):

```tsx
const [favorites, setFavorites] = useState(new Set(["zai-org-glm-4.7"]))

const modelsWithFavs = models.map((m) => ({
  ...m,
  is_favorite: favorites.has(m.id),
}))

<ModelSelector
  models={modelsWithFavs}
  value={value}
  onChange={setValue}
  onToggleFavorite={(id) =>
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
/>
```

### Theming

All CSS variables use the `--oms-` prefix and are scoped to `.oms-reset` (inline) and portal containers (`.oms-popover-content`, `.oms-hover-content`). Override them to match your design system:

```css
.oms-reset,
.oms-popover-content,
.oms-hover-content {
  --oms-background: 0 0% 100%;
  --oms-foreground: 222.2 84% 4.9%;
  --oms-popover: 0 0% 100%;
  --oms-popover-foreground: 222.2 84% 4.9%;
  --oms-primary: 222.2 47.4% 11.2%;
  --oms-border: 214.3 31.8% 91.4%;
  --oms-accent: 210 40% 96.1%;
  --oms-muted-foreground: 215.4 16.3% 46.9%;
  --oms-ring: 222.2 84% 4.9%;
  --oms-radius: 0.5rem;
  --oms-popover-width: 300px;
}
```

Dark mode activates automatically via `@media (prefers-color-scheme: dark)`, or when a `.dark` class exists on an ancestor element.

## Development

```bash
# Install dependencies
npm install

# Start Storybook (dev server on port 6006)
npm run storybook

# Run all tests (unit + component + storybook)
npm test

# Watch mode
npm run test:watch

# Type-check
npm run typecheck

# Build for production
npm run build

# Dev build with watch
npm run dev
```

### Project Structure

```
src/
├── index.ts                          # Main entry point (component + hook exports)
├── styles.css                        # Scoped CSS with --oms- variables
├── components/
│   ├── model-selector.tsx            # ModelSelector component
│   ├── model-selector.test.tsx       # Component tests (jsdom)
│   └── model-selector.stories.tsx    # Storybook stories
├── hooks/
│   ├── use-openai-models.ts          # useOpenAIModels hook
│   ├── use-openai-models.test.ts     # Unit tests (normalizers, extractor)
│   └── use-openai-models.hook.test.tsx # Hook integration tests
└── utils/
    ├── index.ts                      # Utils entry point (RSC-safe)
    ├── normalizers.ts                # Model/response normalization
    ├── format.ts                     # formatPrice, formatContextLength
    └── format.test.ts               # Format utility tests
```

### Test Architecture

Tests run in three Vitest projects:

| Project | Environment | Scope |
| --- | --- | --- |
| `unit` | Node | Pure functions (normalizers, formatters) |
| `component` | jsdom | React component + hook integration tests |
| `storybook` | Playwright (Chromium) | Storybook story tests with a11y checks |

### Build Output

Built with [tsup](https://tsup.egoist.dev/) into dual CJS/ESM bundles with TypeScript declarations and sourcemaps:

| Entry | Description | `"use client"` |
| --- | --- | --- |
| `open-model-selector` | React component + hook | ✅ Yes |
| `open-model-selector/utils` | Pure normalizers + formatters | ❌ No (RSC-safe) |
| `open-model-selector/styles.css` | Stylesheet | — |

### Publishing

Automated via GitHub Actions on release creation:

1. Create a GitHub release (tag the version)
2. CI runs typecheck → build → `npm publish --access public`
3. Requires `NPM_TOKEN` secret in repo settings

## Requirements

- Node.js ≥ 18.0.0
- React 18 or 19

## License

[MIT](LICENSE) © [Seth Bang](https://github.com/sethbang)
