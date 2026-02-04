# Open Model Selector

[![npm version](https://badge.fury.io/js/open-model-selector.svg)](https://www.npmjs.com/package/open-model-selector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A generic, reusable React component for selecting models from OpenAI-compatible APIs (OpenAI, OpenRouter, vLLM, etc.).

![Demo](https://via.placeholder.com/600x300?text=Add+Your+Demo+GIF+Here)

## Features

- 🎨 **Premium UI**: Built with Shadcn UI aesthetics (Radix + CSS)
- ⚡ **Zero Config**: No Tailwind config required - styles are self-contained
- 🤖 **Smart Uncontrolled Mode**:
  - **Auto-Sorting**: Sorts by name by default
  - **Persistent Favorites**: Auto-saves favorites to `localStorage` when no handler provided
- 🔄 **Managed Mode**: Fetch models directly from any OpenAI-compatible URL
- 💲 **Pricing & Context**: Auto-extracts metadata from model responses
- 🌙 **Dark Mode**: Automatic dark mode support via CSS media queries

## Installation

```bash
npm install open-model-selector
# or
yarn add open-model-selector
# or
pnpm add open-model-selector
```

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
| `placeholder` | `string` | `"Select a model..."` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the selector |
| `className` | `string` | - | Additional CSS class |

## Theming

The component uses CSS custom properties prefixed with `--oms-`. You can override these in your CSS:

```css
:root {
  --oms-primary: 222.2 47.4% 11.2%;
  --oms-background: 0 0% 100%;
  --oms-foreground: 222.2 84% 4.9%;
  --oms-accent: 210 40% 96.1%;
  --oms-border: 214.3 31.8% 91.4%;
  --oms-radius: 0.5rem;
  /* ... see styles.css for all variables */
}
```

Dark mode is automatically supported via `prefers-color-scheme: dark` media query.

## TypeScript

Full TypeScript support is included. Import types as needed:

```tsx
import { ModelSelector, type Model } from "open-model-selector";
```

## Supported APIs

Works with any OpenAI-compatible `/v1/models` endpoint:

- OpenAI
- OpenRouter
- vLLM
- LiteLLM
- Ollama (with OpenAI compatibility mode)
- Any custom implementation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Seth Bangert](https://github.com/sethbang)
