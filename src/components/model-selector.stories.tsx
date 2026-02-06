import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ModelSelector, SYSTEM_DEFAULT_VALUE } from "./model-selector";
import type { Model } from "../hooks/use-openai-models";

// --- Mock Data ---

const MOCK_MODELS: Model[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    created: 1715000000,
    context_length: 128000,
    is_favorite: false,
    description: "Most capable multimodal model with vision, audio, and text capabilities.",
    pricing: { prompt: "0.0000025", completion: "0.00001" },
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    created: 1720000000,
    context_length: 128000,
    is_favorite: false,
    description: "Small, fast, and affordable model for lightweight tasks.",
    pricing: { prompt: "0.00000015", completion: "0.0000006" },
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    created: 1718000000,
    context_length: 200000,
    is_favorite: true,
    description: "Anthropic's most intelligent model with excellent reasoning.",
    pricing: { prompt: "0.000003", completion: "0.000015" },
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    created: 1710000000,
    context_length: 200000,
    is_favorite: false,
    description: "Ultra-fast, compact model for near-instant responsiveness.",
    pricing: { prompt: "0.00000025", completion: "0.00000125" },
  },
  {
    id: "meta-llama/llama-3.1-405b-instruct",
    name: "Llama 3.1 405B Instruct",
    provider: "meta-llama",
    created: 1690000000,
    context_length: 131072,
    is_favorite: false,
    description: "Meta's flagship open-source model with 405 billion parameters.",
    pricing: { prompt: "0.000003", completion: "0.000003" },
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B Instruct",
    provider: "meta-llama",
    created: 1690000000,
    context_length: 131072,
    is_favorite: false,
    pricing: { prompt: "0.0000006", completion: "0.0000006" },
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    created: 1725000000,
    context_length: 1048576,
    is_favorite: false,
    description: "Google's fast multimodal model with 1M token context window.",
    pricing: { prompt: "0.0000001", completion: "0.0000004" },
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "mistralai",
    created: 1708000000,
    context_length: 128000,
    is_favorite: true,
    description: "Mistral's flagship model for complex reasoning and multilingual tasks.",
    pricing: { prompt: "0.000002", completion: "0.000006" },
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "deepseek",
    created: 1730000000,
    context_length: 64000,
    is_favorite: false,
    description: "Advanced reasoning model with chain-of-thought capabilities.",
    pricing: { prompt: "0.00000055", completion: "0.0000022" },
  },
  {
    id: "qwen/qwen-2.5-72b-instruct",
    name: "Qwen 2.5 72B Instruct",
    provider: "qwen",
    created: 1722000000,
    context_length: 131072,
    is_favorite: false,
    pricing: { prompt: "0.0000006", completion: "0.0000006" },
  },
];

// --- Venice Live Story Base URL ---
const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

// --- Meta ---

const meta: Meta<typeof ModelSelector> = {
  title: "Components/ModelSelector",
  component: ModelSelector,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof ModelSelector>;

// --- Stories ---

/** Default state with static mock models and controlled selection. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector models={MOCK_MODELS} value={value} onChange={setValue} />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** Pre-selected model on mount. */
export const WithPreselectedModel: Story = {
  render: () => {
    const [value, setValue] = useState("gpt-4o");
    return <ModelSelector models={MOCK_MODELS} value={value} onChange={setValue} />;
  },
};

/** System Default selection. */
export const SystemDefault: Story = {
  render: () => {
    const [value, setValue] = useState<string>(SYSTEM_DEFAULT_VALUE);
    return <ModelSelector models={MOCK_MODELS} value={value} onChange={setValue} />;
  },
};

/** Custom placeholder text. */
export const CustomPlaceholder: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <ModelSelector
        models={MOCK_MODELS}
        value={value}
        onChange={setValue}
        placeholder="Choose an AI model..."
      />
    );
  },
};

/** Controlled sort order (defaults to "created"). */
export const SortByNewest: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [sort, setSort] = useState<"name" | "created">("created");
    return (
      <>
        <ModelSelector
          models={MOCK_MODELS}
          value={value}
          onChange={setValue}
          sortOrder={sort}
          onSortChange={setSort}
        />
        <p style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
          Sort: <code>{sort}</code>
        </p>
      </>
    );
  },
};

/** Controlled favorites with external state. */
export const ControlledFavorites: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [favorites, setFavorites] = useState<Set<string>>(
      new Set(["gpt-4o", "anthropic/claude-3.5-sonnet"])
    );

    const modelsWithFavs = MOCK_MODELS.map((m) => ({
      ...m,
      is_favorite: favorites.has(m.id),
    }));

    return (
      <>
        <ModelSelector
          models={modelsWithFavs}
          value={value}
          onChange={setValue}
          onToggleFavorite={(id) =>
            setFavorites((prev) => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            })
          }
        />
        <p style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
          Favorites: <code>{[...favorites].join(", ")}</code>
        </p>
      </>
    );
  },
};

/** Empty state — no models provided. */
export const EmptyState: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return <ModelSelector models={[]} value={value} onChange={setValue} />;
  },
};

/** Loading state via a base URL that will trigger the hook's loading indicator. */
export const LoadingState: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <ModelSelector
        baseUrl="https://httpbin.org/delay/30"
        value={value}
        onChange={setValue}
      />
    );
  },
};

/** Error state via an invalid API endpoint. */
export const ErrorState: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <ModelSelector
        baseUrl="https://httpbin.org/status/500"
        value={value}
        onChange={setValue}
      />
    );
  },
};

/** Popover opens upward. */
export const PopoverTop: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div style={{ marginTop: 300 }}>
        <ModelSelector
          models={MOCK_MODELS}
          value={value}
          onChange={setValue}
          side="top"
        />
      </div>
    );
  },
};

/** Wide container to test responsive behavior. */
export const WideContainer: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 600, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [value, setValue] = useState("");
    return <ModelSelector models={MOCK_MODELS} value={value} onChange={setValue} />;
  },
};

/** Dark mode preview (applies `.dark` class to parent). */
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{
          width: 320,
          padding: 24,
          backgroundColor: "hsl(222.2 84% 4.9%)",
          borderRadius: 8,
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [value, setValue] = useState("anthropic/claude-3.5-sonnet");
    return <ModelSelector models={MOCK_MODELS} value={value} onChange={setValue} />;
  },
};

/** Minimal models — only 2 options without pricing or descriptions. */
export const MinimalModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const minimal: Model[] = [
      {
        id: "model-a",
        name: "Model A",
        provider: "custom",
        created: 1700000000,
        context_length: 0,
        pricing: {},
        is_favorite: false,
      },
      {
        id: "model-b",
        name: "Model B",
        provider: "custom",
        created: 1700000000,
        context_length: 0,
        pricing: {},
        is_favorite: false,
      },
    ];
    return <ModelSelector models={minimal} value={value} onChange={setValue} />;
  },
};

/** Live Venice.ai API — fetches real models from the Venice endpoint. No API key needed for model discovery. */
export const VeniceLive: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          baseUrl={VENICE_BASE_URL}
          value={value}
          onChange={setValue}
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};
