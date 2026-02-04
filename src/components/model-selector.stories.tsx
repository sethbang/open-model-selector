import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ModelSelector, SYSTEM_DEFAULT_VALUE } from "./model-selector";
import { TextModelSelector } from "./text-model-selector";
import { ImageModelSelector } from "./image-model-selector";
import { VideoModelSelector } from "./video-model-selector";
import type {
  TextModel,
  ImageModel,
  VideoModel,
  InpaintModel,
  EmbeddingModel,
  TtsModel,
  AsrModel,
  UpscaleModel,
  AnyModel,
} from "../types";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_MODELS: TextModel[] = [
  {
    id: "zai-org-glm-4.7",
    name: "GLM 4.7",
    provider: "venice.ai",
    created: 1766534400,
    type: "text",
    context_length: 198000,
    is_favorite: true,
    description: "Strong reasoning capabilities with the largest context window for detailed analysis.",
    pricing: { prompt: 0.00000055, completion: 0.00000265 },
    capabilities: { supportsVision: true, supportsReasoning: true },
  },
  {
    id: "qwen3-235b-a22b-thinking-2507",
    name: "Qwen 3 235B A22B Thinking 2507",
    provider: "venice.ai",
    created: 1745903059,
    type: "text",
    context_length: 128000,
    is_favorite: false,
    description: "Built for in-depth research and handling long, complex documents.",
    pricing: { prompt: 0.00000045, completion: 0.0000035 },
    capabilities: { supportsReasoning: true, supportsFunctionCalling: true },
  },
  {
    id: "qwen3-coder-480b-a35b-instruct",
    name: "Qwen 3 Coder 480B",
    provider: "venice.ai",
    created: 1745903059,
    type: "text",
    context_length: 256000,
    is_favorite: true,
    description: "Optimized for code generation and software engineering.",
    pricing: { prompt: 0.00000075, completion: 0.000003 },
    capabilities: { optimizedForCode: true, supportsFunctionCalling: true },
  },
  {
    id: "qwen3-vl-235b-a22b",
    name: "Qwen3 VL 235B",
    provider: "venice.ai",
    created: 1768521600,
    type: "text",
    context_length: 256000,
    is_favorite: false,
    description: "The most powerful VL model with superior visual perception, OCR, and multimodal reasoning.",
    pricing: { prompt: 0.00000025, completion: 0.0000015 },
    capabilities: { supportsVision: true },
  },
  {
    id: "mistral-31-24b",
    name: "Venice Medium",
    provider: "venice.ai",
    created: 1742262554,
    type: "text",
    context_length: 128000,
    is_favorite: false,
    description: "Balanced blend of speed and capability. Handles most everyday tasks with reliability.",
    pricing: { prompt: 0.0000005, completion: 0.000002 },
  },
  {
    id: "qwen3-4b",
    name: "Venice Small",
    provider: "venice.ai",
    created: 1745903059,
    type: "text",
    context_length: 32000,
    is_favorite: false,
    description: "Optimized for speed and efficiency. Best for quick answers and lightweight tasks.",
    pricing: { prompt: 0.00000005, completion: 0.00000015 },
  },
  {
    id: "venice-uncensored",
    name: "Venice Uncensored 1.1",
    provider: "venice.ai",
    created: 1742262554,
    type: "text",
    context_length: 32000,
    is_favorite: false,
    description: "Designed for maximum creative freedom and authentic interaction.",
    pricing: { prompt: 0.0000002, completion: 0.0000009 },
  },
  {
    id: "claude-opus-45",
    name: "Claude Opus 4.5",
    provider: "venice.ai",
    created: 1764979200,
    type: "text",
    context_length: 198000,
    is_favorite: false,
    description: "Anthropic's frontier reasoning model optimized for complex software engineering.",
    pricing: { prompt: 0.000006, completion: 0.00003, cache_input: 0.000003, cache_write: 0.0000075 },
    capabilities: { supportsReasoning: true, optimizedForCode: true, supportsFunctionCalling: true },
  },
  {
    id: "openai-gpt-52",
    name: "GPT-5.2",
    provider: "venice.ai",
    created: 1765584000,
    type: "text",
    context_length: 256000,
    is_favorite: false,
    description: "OpenAI's latest frontier-grade model with adaptive reasoning.",
    pricing: { prompt: 0.00000219, completion: 0.0000175 },
    capabilities: { supportsVision: true, supportsReasoning: true, supportsFunctionCalling: true, supportsWebSearch: true },
  },
  {
    id: "deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "venice.ai",
    created: 1764806400,
    type: "text",
    context_length: 160000,
    is_favorite: false,
    description: "Efficient model with strong reasoning and tool-use skills.",
    pricing: { prompt: 0.0000004, completion: 0.000001 },
    capabilities: { supportsFunctionCalling: true },
  },
];

// --- Mock Image Models ---

const MOCK_IMAGE_MODELS: ImageModel[] = [
  {
    id: "fluently-xl",
    name: "Fluently XL",
    provider: "venice.ai",
    created: 1700000000,
    type: "image",
    is_favorite: false,
    pricing: { generation: 0.04, upscale_2x: 0.04, upscale_4x: 0.08 },
    constraints: {
      steps: { default: 25, max: 50 },
      aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
      defaultAspectRatio: "1:1",
    },
  },
  {
    id: "flux-dev",
    name: "FLUX Dev",
    provider: "venice.ai",
    created: 1700100000,
    type: "image",
    is_favorite: false,
    pricing: { generation: 0.06 },
    constraints: {
      steps: { default: 30, max: 50 },
      aspectRatios: ["1:1", "16:9", "9:16"],
      defaultAspectRatio: "1:1",
    },
    supportsWebSearch: true,
  },
  {
    id: "flux-dev-uncensored",
    name: "FLUX Dev Uncensored",
    provider: "venice.ai",
    created: 1700200000,
    type: "image",
    is_favorite: false,
    pricing: { generation: 0.06 },
    constraints: {
      steps: { default: 30, max: 50 },
      aspectRatios: ["1:1", "16:9", "9:16", "4:3"],
      defaultAspectRatio: "1:1",
    },
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    provider: "venice.ai",
    created: 1700300000,
    type: "image",
    is_favorite: false,
    pricing: { resolutions: { "1K": 0.18, "2K": 0.24, "4K": 0.35 } },
    constraints: {
      resolutions: ["1K", "2K", "4K"],
      defaultResolution: "1K",
      aspectRatios: ["1:1", "16:9", "9:16"],
      defaultAspectRatio: "1:1",
    },
  },
];

// --- Mock Video Models ---

const MOCK_VIDEO_MODELS: VideoModel[] = [
  {
    id: "wan-2.1-14b-text-to-video",
    name: "Wan 2.1 14B Text-to-Video",
    provider: "venice.ai",
    created: 1700000000,
    type: "video",
    is_favorite: false,
    constraints: {
      model_type: "text-to-video",
      durations: ["5", "10"],
      resolutions: ["480p", "720p"],
      audio: false,
    },
    model_sets: ["standard"],
  },
  {
    id: "wan-2.1-14b-image-to-video",
    name: "Wan 2.1 14B Image-to-Video",
    provider: "venice.ai",
    created: 1700100000,
    type: "video",
    is_favorite: false,
    constraints: {
      model_type: "image-to-video",
      durations: ["5"],
      resolutions: ["720p"],
      audio: false,
    },
    model_sets: ["standard"],
  },
  {
    id: "kling-2.0-master",
    name: "Kling 2.0 Master",
    provider: "venice.ai",
    created: 1700200000,
    type: "video",
    is_favorite: false,
    constraints: {
      model_type: "text-to-video",
      durations: ["5", "10"],
      resolutions: ["720p", "1080p"],
      audio: true,
      audio_configurable: true,
    },
    model_sets: ["premium"],
  },
  {
    id: "wan-2.2-a14b-text-to-video",
    name: "Wan 2.2 A14B (Deprecated)",
    provider: "venice.ai",
    created: 1700300000,
    type: "video",
    is_favorite: false,
    deprecation: { date: "2026-02-18T00:00:00.000Z" },
    constraints: {
      model_type: "text-to-video",
      durations: ["5", "10"],
      resolutions: ["480p", "720p"],
      audio: false,
    },
    model_sets: ["standard"],
  },
];

// --- Mock Inpaint Models ---

const MOCK_INPAINT_MODELS: InpaintModel[] = [
  {
    id: "inpaint-flux-1",
    name: "FLUX Inpaint",
    provider: "venice.ai",
    created: 1700000000,
    type: "inpaint",
    is_favorite: false,
    pricing: { generation: 0.05 },
    constraints: {
      aspectRatios: ["1:1", "16:9", "9:16"],
      combineImages: true,
    },
  },
  {
    id: "inpaint-sd-xl",
    name: "Stable Diffusion XL Inpaint",
    provider: "venice.ai",
    created: 1700100000,
    type: "inpaint",
    is_favorite: false,
    pricing: { generation: 0.03 },
    constraints: {
      aspectRatios: ["1:1", "4:3", "3:4"],
    },
  },
];

// --- Mock Embedding Models ---

const MOCK_EMBEDDING_MODELS: EmbeddingModel[] = [
  {
    id: "text-embedding-3-large",
    name: "Text Embedding 3 Large",
    provider: "venice.ai",
    created: 1700000000,
    type: "embedding",
    is_favorite: false,
    description: "High-dimensional embeddings for semantic search and clustering.",
    pricing: { input: 0.00000013, output: 0.00000013 },
  },
  {
    id: "text-embedding-3-small",
    name: "Text Embedding 3 Small",
    provider: "venice.ai",
    created: 1700100000,
    type: "embedding",
    is_favorite: false,
    description: "Cost-efficient embeddings for lightweight retrieval.",
    pricing: { input: 0.00000002 },
  },
];

// --- Mock TTS Models ---

const MOCK_TTS_MODELS: TtsModel[] = [
  {
    id: "tts-hd",
    name: "TTS HD",
    provider: "venice.ai",
    created: 1700000000,
    type: "tts",
    is_favorite: false,
    description: "High-fidelity text-to-speech with natural intonation.",
    pricing: { input: 0.000015 },
    voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
  },
  {
    id: "tts-standard",
    name: "TTS Standard",
    provider: "venice.ai",
    created: 1700100000,
    type: "tts",
    is_favorite: false,
    description: "Efficient speech synthesis for production workloads.",
    pricing: { input: 0.000004 },
    voices: ["alloy", "echo", "nova"],
  },
];

// --- Mock ASR Models ---

const MOCK_ASR_MODELS: AsrModel[] = [
  {
    id: "whisper-large-v3",
    name: "Whisper Large V3",
    provider: "venice.ai",
    created: 1700000000,
    type: "asr",
    is_favorite: false,
    description: "State-of-the-art speech recognition with multi-language support.",
    pricing: { per_audio_second: 0.0001 },
  },
];

// --- Mock Upscale Models ---

const MOCK_UPSCALE_MODELS: UpscaleModel[] = [
  {
    id: "upscale-fast",
    name: "Upscale Fast",
    provider: "venice.ai",
    created: 1700000000,
    type: "upscale",
    is_favorite: false,
    description: "Quick 2x upscale with AI enhancement.",
    pricing: { generation: 0.04 },
  },
  {
    id: "upscale-ultra",
    name: "Upscale Ultra",
    provider: "venice.ai",
    created: 1700100000,
    type: "upscale",
    is_favorite: false,
    description: "Premium 4x upscale with detail reconstruction.",
    pricing: { generation: 0.12 },
  },
];

// --- Models with special badges (privacy, beta, offline) ---

const MOCK_MODELS_WITH_BADGES: TextModel[] = [
  {
    id: "private-model",
    name: "Private Reasoning Model",
    provider: "venice.ai",
    created: 1766534400,
    type: "text",
    context_length: 128000,
    is_favorite: false,
    description: "End-to-end encrypted inference with zero data retention.",
    pricing: { prompt: 0.000002, completion: 0.000008 },
    privacy: "private",
    capabilities: { supportsReasoning: true },
  },
  {
    id: "anon-model",
    name: "Anonymized Chat Model",
    provider: "venice.ai",
    created: 1765584000,
    type: "text",
    context_length: 64000,
    is_favorite: false,
    description: "Anonymized request routing — no PII stored.",
    pricing: { prompt: 0.0000005, completion: 0.000002 },
    privacy: "anonymized",
  },
  {
    id: "beta-vision-model",
    name: "Vision Beta 2.0",
    provider: "venice.ai",
    created: 1768521600,
    type: "text",
    context_length: 198000,
    is_favorite: true,
    description: "Experimental multimodal model with video understanding.",
    pricing: { prompt: 0.000001, completion: 0.000004 },
    betaModel: true,
    capabilities: { supportsVision: true, supportsReasoning: true },
  },
  {
    id: "offline-model",
    name: "Legacy LLM (Offline)",
    provider: "venice.ai",
    created: 1700000000,
    type: "text",
    context_length: 32000,
    is_favorite: false,
    description: "This model is currently unavailable.",
    pricing: { prompt: 0.0000001, completion: 0.0000005 },
    offline: true,
  },
];

// --- Models with deprecation ---

const MOCK_DEPRECATED_TEXT_MODELS: TextModel[] = [
  ...MOCK_MODELS.slice(0, 3),
  {
    id: "old-model-deprecated",
    name: "Legacy GPT-4o (Deprecated)",
    provider: "venice.ai",
    created: 1700000000,
    type: "text",
    context_length: 128000,
    is_favorite: false,
    description: "This model has been deprecated and will be removed.",
    pricing: { prompt: 0.000005, completion: 0.000015 },
    deprecation: { date: "2025-12-01T00:00:00.000Z" },
  },
  {
    id: "sunsetting-model",
    name: "Sunsetting Model (Feb 2026)",
    provider: "venice.ai",
    created: 1742262554,
    type: "text",
    context_length: 64000,
    is_favorite: false,
    description: "Scheduled for deprecation — migrate to a newer model.",
    pricing: { prompt: 0.0000003, completion: 0.000001 },
    deprecation: { date: "2026-02-28T00:00:00.000Z" },
  },
];

// --- Venice Live Story Base URL ---
const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

// ─── Meta ────────────────────────────────────────────────────────────────────

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

// ─── Core Stories ────────────────────────────────────────────────────────────

/** Default state with static mock models and controlled selection. Shows full model details on select. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [selectedModel, setSelectedModel] = useState<AnyModel | null>(null);
    return (
      <>
        <ModelSelector
          models={MOCK_MODELS}
          value={value}
          onChange={(id, model) => {
            setValue(id);
            setSelectedModel(model);
          }}
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
        {selectedModel && (
          <pre style={{ marginTop: 8, fontSize: 10, color: "#888", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(selectedModel, null, 2)}
          </pre>
        )}
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

/** Hide the "Use System Default" option. */
export const HideSystemDefault: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <ModelSelector
        models={MOCK_MODELS}
        value={value}
        onChange={setValue}
        showSystemDefault={false}
      />
    );
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

// ─── Layout Variants ─────────────────────────────────────────────────────────

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
    const minimal: TextModel[] = [
      {
        id: "model-a",
        name: "Model A",
        provider: "custom",
        created: 1700000000,
        type: "text",
        context_length: 0,
        pricing: {},
        is_favorite: false,
      },
      {
        id: "model-b",
        name: "Model B",
        provider: "custom",
        created: 1700000000,
        type: "text",
        context_length: 0,
        pricing: {},
        is_favorite: false,
      },
    ];
    return <ModelSelector models={minimal} value={value} onChange={setValue} />;
  },
};

// ─── Capabilities & Badges ───────────────────────────────────────────────────

/** Text models with capability badges (vision, reasoning, code, functions). */
export const WithCapabilities: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector models={MOCK_MODELS} value={value} onChange={setValue} />
        <p style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
          Hover over models to see capability badges in the tooltip.
        </p>
      </>
    );
  },
};

/** Models with privacy, beta, and offline badges. */
export const WithBadges: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          models={MOCK_MODELS_WITH_BADGES}
          value={value}
          onChange={setValue}
          placeholder="Select badged model..."
        />
        <p style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
          Hover for Private, Anonymized, Beta, Offline badges.
        </p>
      </>
    );
  },
};

// ─── Deprecation ─────────────────────────────────────────────────────────────

/** Text models with past and future deprecation dates. */
export const DeprecatedTextModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          models={MOCK_DEPRECATED_TEXT_MODELS}
          value={value}
          onChange={setValue}
        />
        <p style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
          Warning badges visible on deprecated/deprecating models.
        </p>
      </>
    );
  },
};

/** showDeprecated=false filters out past-deprecated models entirely. */
export const HideDeprecated: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          models={MOCK_DEPRECATED_TEXT_MODELS}
          value={value}
          onChange={setValue}
          showDeprecated={false}
        />
        <p style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
          Past-deprecated models are hidden. Future-deprecating models remain.
        </p>
      </>
    );
  },
};

// ─── Typed Selectors ─────────────────────────────────────────────────────────

/** TextModelSelector — pre-filtered to type="text". */
export const TextModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <TextModelSelector
          models={MOCK_MODELS}
          value={value}
          onChange={setValue}
          placeholder="Select text model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** ImageModelSelector with mock image models. */
export const ImageModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ImageModelSelector
          models={MOCK_IMAGE_MODELS}
          value={value}
          onChange={setValue}
          placeholder="Select image model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** VideoModelSelector with mock video models. */
export const VideoModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <VideoModelSelector
          models={MOCK_VIDEO_MODELS}
          value={value}
          onChange={setValue}
          placeholder="Select video model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** VideoModelSelector showing deprecated models. */
export const WithDeprecatedModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <VideoModelSelector
        models={MOCK_VIDEO_MODELS}
        value={value}
        onChange={setValue}
        placeholder="Select video model..."
        showDeprecated
      />
    );
  },
};

// ─── Additional Model Types ──────────────────────────────────────────────────

/** Inpaint models with pricing and constraint details. */
export const InpaintModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          models={MOCK_INPAINT_MODELS}
          value={value}
          onChange={setValue}
          placeholder="Select inpaint model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** Embedding models with per-token pricing. */
export const EmbeddingModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          models={MOCK_EMBEDDING_MODELS}
          value={value}
          onChange={setValue}
          placeholder="Select embedding model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** TTS models with voice counts. */
export const TtsModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          models={MOCK_TTS_MODELS}
          value={value}
          onChange={setValue}
          placeholder="Select TTS model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** ASR (speech recognition) models with per-second pricing. */
export const AsrModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          models={MOCK_ASR_MODELS}
          value={value}
          onChange={setValue}
          placeholder="Select ASR model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** Upscale models with flat pricing. */
export const UpscaleModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          models={MOCK_UPSCALE_MODELS}
          value={value}
          onChange={setValue}
          placeholder="Select upscale model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

// ─── All Types Mixed ─────────────────────────────────────────────────────────

/** ModelSelector with ALL 8 model types mixed together. */
export const AllTypes: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const allModels: AnyModel[] = [
      ...MOCK_MODELS,
      ...MOCK_IMAGE_MODELS,
      ...MOCK_VIDEO_MODELS,
      ...MOCK_INPAINT_MODELS,
      ...MOCK_EMBEDDING_MODELS,
      ...MOCK_TTS_MODELS,
      ...MOCK_ASR_MODELS,
      ...MOCK_UPSCALE_MODELS,
    ];
    return (
      <>
        <ModelSelector
          models={allModels}
          value={value}
          onChange={setValue}
          placeholder="Select any model..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
          <br />
          Total models: <code>{allModels.length}</code>
        </p>
      </>
    );
  },
};

// ─── Venice Live ─────────────────────────────────────────────────────────────

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

/** Venice Live — all model types (no type filter). */
export const VeniceLiveAllTypes: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ModelSelector
          baseUrl={VENICE_BASE_URL}
          value={value}
          onChange={setValue}
          placeholder="Select any model (Venice Live)..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** Venice Live — text models only. */
export const VeniceLiveTextModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <TextModelSelector
          baseUrl={VENICE_BASE_URL}
          value={value}
          onChange={setValue}
          placeholder="Select text model (Venice Live)..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** Venice Live — image models only. */
export const VeniceLiveImageModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <ImageModelSelector
          baseUrl={VENICE_BASE_URL}
          value={value}
          onChange={setValue}
          placeholder="Select image model (Venice Live)..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};

/** Venice Live — video models only. */
export const VeniceLiveVideoModels: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <>
        <VideoModelSelector
          baseUrl={VENICE_BASE_URL}
          value={value}
          onChange={setValue}
          placeholder="Select video model (Venice Live)..."
        />
        <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          Selected: <code>{value || "none"}</code>
        </p>
      </>
    );
  },
};
