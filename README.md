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
npm install open-model-selector react react-dom @radix-ui/react-popover @radix-ui/react-hover-card @radix-ui/react-dropdown-menu @radix-ui/react-slot cmdk
# or
yarn add open-model-selector react react-dom @radix-ui/react-popover @radix-ui/react-hover-card @radix-ui/react-dropdown-menu @radix-ui/react-slot cmdk
# or
pnpm add open-model-selector react react-dom @radix-ui/react-popover @radix-ui/react-hover-card @radix-ui/react-dropdown-menu @radix-ui/react-slot cmdk
```

The package supports both ES Modules (`import`) and CommonJS (`require`).

**Peer Dependencies:**
- `react` >= 18 (React 19 supported)
- `react-dom` >= 18 (React 19 supported)
- `@radix-ui/react-popover` >= 1.0.0
- `@radix-ui/react-hover-card` >= 1.0.0
- `@radix-ui/react-dropdown-menu` >= 2.0.0
- `@radix-ui/react-slot` >= 1.0.0
- `cmdk` >= 1.0.0

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
| `models` | `Model[]` | `[]` | Static list of models to display. If provided, API fetching is disabled. |
| `baseUrl` | `string` | - | Base URL for the OpenAI-compatible API endpoint (e.g., `"https://api.openai.com/v1"`) |
| `apiKey` | `string` | - | API key for authentication. Warning: Visible in browser DevTools. |
| `value` | `string` | - | Currently selected model ID (controlled component pattern) |
| `onChange` | `(modelId: string) => void` | **required** | Callback fired when a model is selected. Receives the model ID. |
| `onToggleFavorite` | `(modelId: string) => void` | - | Callback fired when a model is favorited/unfavorited. Only relevant if favorites are controlled. |
| `placeholder` | `string` | `"Select model..."` | Placeholder text shown when no model is selected |
| `sortOrder` | `"name" \| "created"` | - | Current sort order for models. If provided, component operates in controlled mode for sorting. |
| `onSortChange` | `(order: "name" \| "created") => void` | - | Callback fired when sort order changes. Only relevant if `sortOrder` is controlled. |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Popover placement relative to the trigger |

### SYSTEM_DEFAULT_VALUE

The package exports a `SYSTEM_DEFAULT_VALUE` constant (`"system_default"`) that enables a "Use System Default" option in the selector. When the user selects this option, your `onChange` callback will receive this value instead of a model ID.

```tsx
import { ModelSelector, SYSTEM_DEFAULT_VALUE } from "open-model-selector";

function MyComponent() {
  const [model, setModel] = useState<string>("gpt-4");

  const handleChange = (modelId: string) => {
    if (modelId === SYSTEM_DEFAULT_VALUE) {
      // User selected "Use System Default"
      console.log("Using system default model");
    } else {
      // User selected a specific model
      console.log("Selected model:", modelId);
    }
    setModel(modelId);
  };

  return (
    <ModelSelector
      baseUrl="https://openrouter.ai/api/v1"
      value={model}
      onChange={handleChange}
    />
  );
}
```

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
- React 18+ (including React 19)
- Requires `fetch` API and `localStorage`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Seth Bang](https://github.com/sethbang)
