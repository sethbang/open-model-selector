# Open Model Selector

A drop-in React component for selecting AI models from any OpenAI-compatible API. Built for [Venice.ai](https://venice.ai) and works with OpenAI, OpenRouter, and any provider that implements the `/v1/models` endpoint.

Ships with built-in search, favorites, sorting, hover-card details, dark mode, and full keyboard navigation — all in a single unstyled-friendly package.

## Features

- **OpenAI-compatible** — works out of the box with [Venice.ai](https://venice.ai), OpenAI, OpenRouter, and any `/v1/models`-shaped API
- **Two operating modes** — fetch models automatically (managed) or pass them in directly (controlled)
- **Search & sort** — fuzzy search by name/provider/ID with toggleable A-Z or newest-first ordering
- **Favorites** — star models to pin them; persisted to `localStorage` by default or fully controlled via props
- **Hover-card details** — context length, pricing, and description on hover
- **"Use System Default"** — optional sentinel value for apps that allow server-side model selection
- **Dark mode** — automatic via `prefers-color-scheme` or class-based (`.dark`)
- **Accessible** — ARIA attributes, keyboard navigation, and `combobox` semantics
- **Customizable** — CSS custom properties (`--oms-*`), custom fetchers, normalizers, and response extractors
- **Lightweight** — built on [Radix UI](https://www.radix-ui.com/) primitives and [cmdk](https://cmdk.paco.me/)
- **TypeScript-first** — full type exports for all public APIs

## Installation

```bash
npm install open-model-selector
```

### Peer Dependencies

The following peer dependencies must be installed in your project:

```bash
npm install react react-dom @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-popover cmdk
```

| Package | Version |
|---|---|
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `@radix-ui/react-dropdown-menu` | `^2.0.0` |
| `@radix-ui/react-hover-card` | `^1.0.0` |
| `@radix-ui/react-popover` | `^1.0.0` |
| `cmdk` | `^1.0.0` |

## Quick Start

### Import the stylesheet

The component ships its own scoped CSS. Import it once at your app's entry point:

```tsx
import "open-model-selector/styles.css";
```

### Managed Mode — fetch models from Venice.ai

Point the component at any OpenAI-compatible endpoint and it fetches the model list automatically. Venice.ai's `/v1/models` endpoint requires no API key for model discovery:

```tsx
import { useState } from "react";
import { ModelSelector } from "open-model-selector";

function App() {
  const [model, setModel] = useState("");

  return (
    <ModelSelector
      baseUrl="https://api.venice.ai/api/v1"
      value={model}
      onChange={setModel}
    />
  );
}
```

This single snippet gives you a searchable dropdown populated with all of Venice.ai's text models — including GLM 4.7, Qwen 3 235B, DeepSeek V3.2, Claude Opus 4.6, GPT-5.2, and more — complete with pricing, context lengths, and hover-card details.

### Managed Mode — with API key authentication

For providers that require authentication (OpenAI, OpenRouter, etc.):

```tsx
<ModelSelector
  baseUrl="https://api.openai.com/v1"
  apiKey="sk-..."
  value={model}
  onChange={setModel}
/>
```

> ⚠️ **Security note:** The `apiKey` prop is visible in browser DevTools. For production use, route requests through a backend proxy via the [`fetcher`](#custom-fetcher-proxy--ssr) prop.

### Controlled Mode — pass models directly

Supply your own model array when you already have the data or want full control:

```tsx
import { useState } from "react";
import { ModelSelector } from "open-model-selector";
import type { Model } from "open-model-selector";

const models: Model[] = [
  {
    id: "qwen3-235b-a22b-thinking-2507",
    name: "Qwen 3 235B A22B Thinking 2507",
    provider: "venice.ai",
    created: 1745903059,
    context_length: 128000,
    description: "Built for in-depth research and handling long, complex documents.",
    pricing: { prompt: 0.00000045, completion: 0.0000035 },
    is_favorite: false,
  },
  {
    id: "zai-org-glm-4.7",
    name: "GLM 4.7",
    provider: "venice.ai",
    created: 1766534400,
    context_length: 198000,
    description: "Strong reasoning capabilities with the largest context window for detailed analysis.",
    pricing: { prompt: 0.00000055, completion: 0.00000265 },
    is_favorite: false,
  },
  {
    id: "deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "venice.ai",
    created: 1764806400,
    context_length: 160000,
    description: "Efficient large language model with strong reasoning and tool-use skills.",
    pricing: { prompt: 0.0000004, completion: 0.000001 },
    is_favorite: false,
  },
];

function App() {
  const [model, setModel] = useState("");

  return (
    <ModelSelector
      models={models}
      value={model}
      onChange={setModel}
    />
  );
}
```

## API Reference

### `<ModelSelector />`

The primary component. Renders a combobox-style trigger button that opens a searchable, sortable model list in a popover.

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `models` | [`Model[]`](#model) | `[]` | Static list of models. When non-empty, disables internal API fetching. |
| `baseUrl` | `string` | — | Base URL for an OpenAI-compatible `/models` endpoint (e.g., `"https://api.venice.ai/api/v1"`). |
| `apiKey` | `string` | — | Bearer token for API authentication. ⚠️ Visible in browser DevTools. |
| `fetcher` | `(url: string, init?: RequestInit) => Promise<Response>` | `fetch` | Custom fetch function for SSR, proxies, or testing. No `useCallback` needed. |
| `responseExtractor` | [`ResponseExtractor`](#responseextractor) | [`defaultResponseExtractor`](#defaultresponseextractor) | Extracts the raw model array from the API response body. |
| `normalizer` | [`ModelNormalizer`](#modelnormalizer) | [`defaultModelNormalizer`](#defaultmodelnormalizer) | Transforms each raw model object into a [`Model`](#model). |
| `value` | `string` | — | Currently selected model ID (controlled). |
| `onChange` | `(modelId: string) => void` | — | Fires when a model is selected. A dev-mode warning is logged if omitted. |
| `onToggleFavorite` | `(modelId: string) => void` | — | Fires when a model is favorited/unfavorited. Enables controlled favorites. |
| `placeholder` | `string` | `"Select model..."` | Text shown when no model is selected. |
| `sortOrder` | `"name" \| "created"` | `"name"` (internal) | Controlled sort order. |
| `onSortChange` | `(order: "name" \| "created") => void` | — | Fires when sort order changes. |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Popover placement relative to the trigger. |
| `className` | `string` | — | Additional CSS class(es) on the root element. |
| `storageKey` | `string` | `"open-model-selector-favorites"` | `localStorage` key for persisting favorites in uncontrolled mode. |
| `showSystemDefault` | `boolean` | `true` | Whether to show the "Use System Default" option. |

The component accepts a `ref` (forwarded to the root `<div>`).

---

### `SYSTEM_DEFAULT_VALUE`

```ts
import { SYSTEM_DEFAULT_VALUE } from "open-model-selector";
// "system_default"
```

Sentinel string constant for the "Use System Default" option. Compare against `value` to detect when the user has chosen system default.

---

### `useOpenAIModels(props)`

A standalone React hook for fetching and normalizing models from any OpenAI-compatible API. Use this when you need model data without the UI component.

```tsx
import { useOpenAIModels } from "open-model-selector";

function MyComponent() {
  const { models, loading, error } = useOpenAIModels({
    baseUrl: "https://api.venice.ai/api/v1",
  });

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {models.map((m) => (
        <li key={m.id}>{m.name} — {m.provider}</li>
      ))}
    </ul>
  );
}
```

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `baseUrl` | `string` | — | API base URL. The hook appends `/models` automatically. |
| `apiKey` | `string` | — | Bearer token sent via `Authorization` header. |
| `fetcher` | `(url: string, init?: RequestInit) => Promise<Response>` | `fetch` | Custom fetch function. Stored in a ref — no memoization needed. |
| `responseExtractor` | [`ResponseExtractor`](#responseextractor) | [`defaultResponseExtractor`](#defaultresponseextractor) | Extracts raw model array from response JSON. |
| `normalizer` | [`ModelNormalizer`](#modelnormalizer) | [`defaultModelNormalizer`](#defaultmodelnormalizer) | Normalizes each raw object into a [`Model`](#model). |

#### Return Value

| Field | Type | Description |
|---|---|---|
| `models` | [`Model[]`](#model) | Normalized model array. Empty until fetch completes. |
| `loading` | `boolean` | `true` while the request is in-flight. |
| `error` | `Error \| null` | Error object if the fetch or normalization failed. |

---

### `defaultResponseExtractor`

```ts
import { defaultResponseExtractor } from "open-model-selector";
```

Extracts the raw model array from a JSON response body. Handles:

- Top-level arrays → returned as-is
- `{ data: [...] }` → OpenAI / Venice.ai standard
- `{ models: [...] }` → alternative convention

---

### `defaultModelNormalizer`

```ts
import { defaultModelNormalizer } from "open-model-selector";
```

Transforms a raw model object into a normalized [`Model`](#model). Has built-in support for response shapes from:

- **Venice.ai** — `model_spec.name`, `model_spec.availableContextTokens`, `model_spec.pricing` (per-million-token format, auto-converted to per-token)
- **OpenAI** — standard `id`, `name`, `context_length`, `pricing` fields
- **OpenRouter** — slash-separated IDs (`anthropic/claude-3-opus`), `context_length`, `pricing`

You can extend it for partial overrides:

```ts
normalizer={(raw) => ({
  ...defaultModelNormalizer(raw),
  provider: raw.vendor as string ?? "custom",
})}
```

## Types

### `Model`

```ts
interface Model {
  id: string;            // Unique model identifier (e.g., "qwen3-235b-a22b-thinking-2507")
  name: string;          // Display name (e.g., "Qwen 3 235B A22B Thinking 2507")
  provider: string;      // Provider (e.g., "venice.ai", "openai", "anthropic")
  created: number;       // Unix timestamp
  description?: string;  // Optional capability description
  context_length: number; // Max context window in tokens
  pricing: ModelPricing; // Pricing information
  is_favorite: boolean;  // Whether starred by the user
}
```

### `ModelPricing`

```ts
interface ModelPricing {
  prompt?: string | number;     // Price per token (input)
  completion?: string | number; // Price per token (output)
  [key: string]: unknown;       // Additional pricing fields
}
```

### `ResponseExtractor`

```ts
type ResponseExtractor = (
  body: Record<string, unknown> | unknown[]
) => Record<string, unknown>[];
```

### `ModelNormalizer`

```ts
type ModelNormalizer = (raw: Record<string, unknown>) => Model;
```

## Theming

The component uses CSS custom properties prefixed with `--oms-` to avoid collisions with your app's styles. Override them to match your design system:

```css
:root {
  --oms-background: 0 0% 100%;
  --oms-foreground: 222.2 84% 4.9%;
  --oms-popover: 0 0% 100%;
  --oms-popover-foreground: 222.2 84% 4.9%;
  --oms-primary: 222.2 47.4% 11.2%;
  --oms-primary-foreground: 210 40% 98%;
  --oms-secondary: 210 40% 96.1%;
  --oms-secondary-foreground: 222.2 47.4% 11.2%;
  --oms-muted: 210 40% 96.1%;
  --oms-muted-foreground: 215.4 16.3% 46.9%;
  --oms-accent: 210 40% 96.1%;
  --oms-accent-foreground: 222.2 47.4% 11.2%;
  --oms-destructive: 0 84.2% 60.2%;
  --oms-border: 214.3 31.8% 91.4%;
  --oms-input: 214.3 31.8% 91.4%;
  --oms-ring: 222.2 84% 4.9%;
  --oms-radius: 0.5rem;
  --oms-popover-width: 300px;
}
```

Values use the HSL channel format (`H S% L%` without `hsl()`) — the same convention as [shadcn/ui](https://ui.shadcn.com/docs/theming).

### Dark Mode

Dark mode activates automatically via `prefers-color-scheme: dark`, or you can toggle it with a `.dark` class on any ancestor element (or on the component's root):

```html
<html class="dark">
  <!-- Component will use dark theme -->
</html>
```

## Advanced Usage

### Custom Fetcher (proxy / SSR)

Route requests through a backend proxy to keep API keys off the client:

```tsx
<ModelSelector
  baseUrl="/api/proxy/v1"
  fetcher={(url, init) =>
    fetch(url, { ...init, credentials: "include" })
  }
  value={model}
  onChange={setModel}
/>
```

The `fetcher` prop is stored in a ref internally — inline functions work without `useCallback`.

### Custom Response Extractor

If the API wraps models in a non-standard shape:

```tsx
<ModelSelector
  baseUrl="https://my-api.com/v1"
  responseExtractor={(body) => body.results.items}
  value={model}
  onChange={setModel}
/>
```

### Custom Normalizer

Map exotic model fields to the standard `Model` shape:

```tsx
import { defaultModelNormalizer } from "open-model-selector";

<ModelSelector
  baseUrl="https://my-api.com/v1"
  normalizer={(raw) => ({
    ...defaultModelNormalizer(raw),
    provider: raw.vendor as string ?? "custom",
    context_length: raw.max_ctx as number ?? 0,
  })}
  value={model}
  onChange={setModel}
/>
```

### Controlled Favorites

Manage favorites externally (e.g., persisted to a database):

```tsx
const [favorites, setFavorites] = useState<Set<string>>(new Set());

const modelsWithFavs = models.map((m) => ({
  ...m,
  is_favorite: favorites.has(m.id),
}));

<ModelSelector
  models={modelsWithFavs}
  value={model}
  onChange={setModel}
  onToggleFavorite={(id) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    })
  }
/>
```

### Multiple Instances

Use `storageKey` to isolate `localStorage` favorites per instance:

```tsx
<ModelSelector storageKey="chat-model-favorites" /* ... */ />
<ModelSelector storageKey="embedding-model-favorites" /* ... */ />
```

### Hiding System Default

```tsx
<ModelSelector showSystemDefault={false} /* ... */ />
```

## Compatibility

The `defaultModelNormalizer` has been tested against live API responses from:

| Provider | Endpoint | Notes |
|---|---|---|
| [Venice.ai](https://venice.ai) | `https://api.venice.ai/api/v1` | No API key needed for model discovery. Full `model_spec` support including per-million pricing normalization. |
| OpenAI | `https://api.openai.com/v1` | Standard `{ data: [...] }` response shape. |
| OpenRouter | `https://openrouter.ai/api/v1` | Slash-separated IDs auto-extracted for provider (e.g., `anthropic/claude-3-opus` → provider `anthropic`). |

## Browser Support

Requires a browser environment with `fetch`, `localStorage`, and ES2020+ support. Node.js ≥ 18 is required for builds.

## Development

```bash
# Install dependencies
npm install

# Run Storybook
npm run storybook

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

## License

[MIT](LICENSE) © Seth Bang
