import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ModelSelector, SYSTEM_DEFAULT_VALUE } from "./model-selector";
import type { Model } from "../hooks/use-openai-models";

// --- Mock Data ---

const MOCK_MODELS: Model[] = [
  {
    id: "zai-org-glm-4.7",
    name: "GLM 4.7",
    provider: "venice.ai",
    created: 1766534400,
    context_length: 198000,
    is_favorite: true,
    description: "Strong reasoning capabilities with the largest context window for detailed analysis.",
    pricing: { prompt: "0.00000055", completion: "0.00000265" },
  },
  {
    id: "qwen3-235b-a22b-thinking-2507",
    name: "Qwen 3 235B A22B Thinking 2507",
    provider: "venice.ai",
    created: 1745903059,
    context_length: 128000,
    is_favorite: false,
    description: "Built for in-depth research and handling long, complex documents.",
    pricing: { prompt: "0.00000045", completion: "0.0000035" },
  },
  {
    id: "qwen3-coder-480b-a35b-instruct",
    name: "Qwen 3 Coder 480B",
    provider: "venice.ai",
    created: 1745903059,
    context_length: 256000,
    is_favorite: true,
    description: "Optimized for code generation and software engineering.",
    pricing: { prompt: "0.00000075", completion: "0.000003" },
  },
  {
    id: "qwen3-vl-235b-a22b",
    name: "Qwen3 VL 235B",
    provider: "venice.ai",
    created: 1768521600,
    context_length: 256000,
    is_favorite: false,
    description: "The most powerful VL model with superior visual perception, OCR, and multimodal reasoning.",
    pricing: { prompt: "0.00000025", completion: "0.0000015" },
  },
  {
    id: "mistral-31-24b",
    name: "Venice Medium",
    provider: "venice.ai",
    created: 1742262554,
    context_length: 128000,
    is_favorite: false,
    description: "Balanced blend of speed and capability. Handles most everyday tasks with reliability.",
    pricing: { prompt: "0.0000005", completion: "0.000002" },
  },
  {
    id: "qwen3-4b",
    name: "Venice Small",
    provider: "venice.ai",
    created: 1745903059,
    context_length: 32000,
    is_favorite: false,
    description: "Optimized for speed and efficiency. Best for quick answers and lightweight tasks.",
    pricing: { prompt: "0.00000005", completion: "0.00000015" },
  },
  {
    id: "venice-uncensored",
    name: "Venice Uncensored 1.1",
    provider: "venice.ai",
    created: 1742262554,
    context_length: 32000,
    is_favorite: false,
    description: "Designed for maximum creative freedom and authentic interaction.",
    pricing: { prompt: "0.0000002", completion: "0.0000009" },
  },
  {
    id: "claude-opus-45",
    name: "Claude Opus 4.5",
    provider: "venice.ai",
    created: 1764979200,
    context_length: 198000,
    is_favorite: false,
    description: "Anthropic's frontier reasoning model optimized for complex software engineering.",
    pricing: { prompt: "0.000006", completion: "0.00003" },
  },
  {
    id: "openai-gpt-52",
    name: "GPT-5.2",
    provider: "venice.ai",
    created: 1765584000,
    context_length: 256000,
    is_favorite: false,
    description: "OpenAI's latest frontier-grade model with adaptive reasoning.",
    pricing: { prompt: "0.00000219", completion: "0.0000175" },
  },
  {
    id: "deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "venice.ai",
    created: 1764806400,
    context_length: 160000,
    is_favorite: false,
    description: "Efficient model with strong reasoning and tool-use skills.",
    pricing: { prompt: "0.0000004", completion: "0.000001" },
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
    const [value, setValue] = useState("zai-org-glm-4.7");
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
      new Set(["zai-org-glm-4.7", "qwen3-coder-480b-a35b-instruct"])
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
    const [value, setValue] = useState("qwen3-coder-480b-a35b-instruct");
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
