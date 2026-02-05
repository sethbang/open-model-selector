# Open Model Selector

[![npm version](https://badge.fury.io/js/open-model-selector.svg)](https://www.npmjs.com/package/open-model-selector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)

A generic, reusable React component for selecting models from OpenAI-compatible APIs (OpenAI, OpenRouter, vLLM, etc.).

## Features

- 🎨 **Premium UI**: Built with Shadcn UI aesthetics (Radix + CSS)
- ⚡ **Zero Config**: No Tailwind config required - styles are self-contained
- 🤖 **Smart Uncontrolled Mode**:
  - **Auto-Sorting**: Sorts by name by default
  - **Persistent Favorites**: Auto-saves favorites to `localStorage` when no handler provided
- 🔄 **Managed Mode**: Fetch models directly from any OpenAI-compatible URL
- 💲 **Pricing & Context**: Auto-extracts metadata from model responses
- 🌙 **Dark Mode**: Automatic dark mode support via CSS media queries

### Favorites Persistence

In uncontrolled mode, favorite models are persisted to `localStorage` under the key `"open-model-selector-favorites"`. To clear favorites:

```tsx
localStorage.removeItem("open-model-selector-favorites")
```

## Installation

```bash
npm install open-model-selector
# or
yarn add open-model-selector
# or
pnpm add open-model-selector
```

The package supports both ES Modules (`import`) and CommonJS (`require`).

**Peer Dependencies:**
- `react` >= 18
- `react-dom` >= 18

## Quick Start

### Managed Mode (simplest)

Let the component fetch models directly from OpenRouter or any OpenAI-compatible API:

```tsx
import "open-model-selector/styles.css"; // 👈 Import the styles
import { ModelSelector } from "open-model-selector";

function MyComponent() {
  const [model, setModel] = useState("openai/gpt-4");

  return (
    <ModelSelector
      baseUrl="https://openrouter.ai/api/v1"
      apiKey={process.env.NEXT_PUBLIC_OPENROUTER_KEY}
      value={model}
      onChange={setModel}
    />
  );
}
```

### Controlled Mode

Fetch data yourself and pass models directly:

```tsx
import "open-model-selector/styles.css";
import { ModelSelector } from "open-model-selector";

const myModels = [
  { id: "gpt-4", name: "GPT-4", created: 123456789, provider: "OpenAI" },
  { id: "claude-3", name: "Claude 3", created: 123456790, provider: "Anthropic" }
];

function MyComponent() {
  const [selectedId, setSelectedId] = useState("gpt-4");
  
  return (
    <ModelSelector 
      models={myModels}
      value={selectedId}
      onChange={setSelectedId}
    />
  );
}
```

## 🔒 Security

**Important**: This component makes API calls directly from the browser.

### API Key Safety

- **Never** hardcode API keys with billing enabled in client-side code
- API keys passed to `apiKey` prop will be visible in browser DevTools
- For server-rendered apps, use environment variables that are NOT exposed to the client

### Recommended Patterns

**Option 1: Backend Proxy** (Recommended)
```tsx
// Use your own endpoint that adds auth server-side
<ModelSelector baseUrl="/api/models" value={model} onChange={setModel} />
```

**Option 2: Pre-fetched Models**
```tsx
// Fetch models server-side and pass directly
<ModelSelector models={modelsFromServer} value={model} onChange={setModel} />
```

**Option 3: Public APIs**
```tsx
// Some APIs don't require auth for listing models
<ModelSelector baseUrl="https://openrouter.ai/api/v1" value={model} onChange={setModel} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | The currently selected model ID |
| `onChange` | `(modelId: string) => void` | - | Callback when a model is selected |
| `models` | `Model[]` | - | Array of models (controlled mode) |
| `baseUrl` | `string` | - | API base URL for fetching models (managed mode) |
| `apiKey` | `string` | - | API key for authentication (managed mode) |
| `favorites` | `string[]` | - | Controlled favorites list |
| `onFavoritesChange` | `(favorites: string[]) => void` | - | Callback for favorites changes |
| `onToggleFavorite` | `(modelId: string) => void` | - | Callback when a model is favorited/unfavorited |
| `sortOrder` | `"default" \| "name" \| "created"` | `"default"` | Controls the sort order of models |
| `onSortChange` | `(order: "default" \| "name" \| "created") => void` | - | Callback when sort order changes |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Popover placement side |
| `placeholder` | `string` | `"Select a model..."` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the selector |
| `className` | `string` | - | Additional CSS class |

## useOpenAIModels Hook

Fetch models from any OpenAI-compatible API.

### Usage

```tsx
import { useOpenAIModels } from "open-model-selector"

function MyComponent() {
  const { models, loading, error } = useOpenAIModels({
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY
  })
  
  if (loading) return <div>Loading models...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>{models.length} models available</div>
}
```

### Hook Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `baseUrl` | `string` | `"https://api.openai.com/v1"` | Base URL for the API |
| `apiKey` | `string` | - | API key for authentication |
| `fetcher` | `(url: string, init?: RequestInit) => Promise<Response>` | `fetch` | Custom fetch function for SSR/testing |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `models` | `Model[]` | Array of available models |
| `loading` | `boolean` | Whether models are being fetched |
| `error` | `Error \| null` | Error if fetch failed |

## TypeScript Types

The package exports these types for TypeScript consumers:

```typescript
import type { 
  Model, 
  ModelSelectorProps, 
  UseOpenAIModelsProps 
} from "open-model-selector"

interface Model {
  id: string
  name: string
  created: number
  is_favorite: boolean
  pricing: Record<string, unknown>
}
```

## Theming

The component uses CSS custom properties prefixed with `--oms-`. You can override these in your CSS:

```css
:root {
  /* Background & Foreground */
  --oms-background: 0 0% 100%;
  --oms-foreground: 222.2 84% 4.9%;

  /* Card */
  --oms-card: 0 0% 100%;
  --oms-card-foreground: 222.2 84% 4.9%;

  /* Popover */
  --oms-popover: 0 0% 100%;
  --oms-popover-foreground: 222.2 84% 4.9%;

  /* Primary */
  --oms-primary: 222.2 47.4% 11.2%;
  --oms-primary-foreground: 210 40% 98%;

  /* Secondary */
  --oms-secondary: 210 40% 96.1%;
  --oms-secondary-foreground: 222.2 47.4% 11.2%;

  /* Muted */
  --oms-muted: 210 40% 96.1%;
  --oms-muted-foreground: 215.4 16.3% 46.9%;

  /* Accent */
  --oms-accent: 210 40% 96.1%;
  --oms-accent-foreground: 222.2 47.4% 11.2%;

  /* Destructive */
  --oms-destructive: 0 84.2% 60.2%;
  --oms-destructive-foreground: 210 40% 98%;

  /* Border, Input, Ring */
  --oms-border: 214.3 31.8% 91.4%;
  --oms-input: 214.3 31.8% 91.4%;
  --oms-ring: 222.2 84% 4.9%;

  /* Radius */
  --oms-radius: 0.5rem;
}
```

Dark mode is automatically supported via `prefers-color-scheme: dark` media query, or by adding a `.dark` class to a parent element.

## Supported APIs

Works with any OpenAI-compatible `/v1/models` endpoint:

- OpenAI
- OpenRouter
- vLLM
- LiteLLM
- Ollama (with OpenAI compatibility mode)
- Any custom implementation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- React 18+
- Requires `fetch` API and `localStorage`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Seth Bang](https://github.com/sethbang)
