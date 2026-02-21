import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ModelSelector } from "./model-selector";
import type { AnyModel, ModelType } from "../types";

// ─── Provider Configuration ─────────────────────────────────────────────────
//
// All requests go through Storybook's Vite dev server proxy (configured in
// .storybook/main.ts) to bypass CORS restrictions. The proxy rewrites
// `/proxy/<slug>/*` → the real upstream endpoint.
//
// API keys are loaded from .env via Vite's `define` (also in main.ts) and
// injected as `import.meta.env.STORYBOOK_*` at build time.
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderConfig {
  name: string;
  /** Shorter name used in placeholder text (e.g. "Venice" instead of "Venice AI") */
  shortName: string;
  /** Local proxy path — Vite rewrites this to the real upstream */
  baseUrl: string;
  /** API key loaded from .env (empty string if not set) */
  apiKey: string;
  /** Whether this provider requires an API key to list models */
  requiresKey: boolean;
  /** Extra query params (e.g., Venice needs type=all) */
  queryParams?: Record<string, string>;
  /** Model count from our test fixtures for reference */
  expectedModels?: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  venice: {
    name: "Venice AI",
    shortName: "Venice",
    baseUrl: "/proxy/venice",
    apiKey: (import.meta.env.STORYBOOK_VENICE_KEY as string) ?? "",
    requiresKey: false,
    queryParams: { type: "all" },
    expectedModels: "~98 (text, image, video, embedding, tts, asr, upscale, inpaint)",
  },
  openrouter: {
    name: "OpenRouter",
    shortName: "OpenRouter",
    baseUrl: "/proxy/openrouter",
    apiKey: (import.meta.env.STORYBOOK_OPENROUTER_KEY as string) ?? "",
    requiresKey: false,
    expectedModels: "~342 (mostly text, some image via architecture.output_modalities)",
  },
  together: {
    name: "Together AI",
    shortName: "Together",
    baseUrl: "/proxy/together",
    apiKey: (import.meta.env.STORYBOOK_TOGETHER_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: "~260 (chat, image, video, audio, embedding, moderation, rerank)",
  },
  openai: {
    name: "OpenAI",
    shortName: "OpenAI",
    baseUrl: "/proxy/openai",
    apiKey: (import.meta.env.STORYBOOK_OPENAI_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: "~120 (text, image, tts, asr, embedding — inferred from model ID)",
  },
  mistral: {
    name: "Mistral AI",
    shortName: "Mistral",
    baseUrl: "/proxy/mistral",
    apiKey: (import.meta.env.STORYBOOK_MISTRAL_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: '~57 (all type:"base" — embedding detected via ID)',
  },
  groq: {
    name: "Groq",
    shortName: "Groq",
    baseUrl: "/proxy/groq",
    apiKey: (import.meta.env.STORYBOOK_GROQ_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: "~20 (text models, fast inference)",
  },
  nvidia: {
    name: "Nvidia NIM",
    shortName: "Nvidia",
    baseUrl: "/proxy/nvidia",
    apiKey: (import.meta.env.STORYBOOK_NVIDIA_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: "~186 (text, embedding — embedqa detected via ID)",
  },
  cerebras: {
    name: "Cerebras",
    shortName: "Cerebras",
    baseUrl: "/proxy/cerebras",
    apiKey: (import.meta.env.STORYBOOK_CEREBRAS_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: "~4 (text models, ultra-fast inference)",
  },
  deepseek: {
    name: "DeepSeek",
    shortName: "DeepSeek",
    baseUrl: "/proxy/deepseek",
    apiKey: (import.meta.env.STORYBOOK_DEEPSEEK_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: "~2 (deepseek-chat, deepseek-reasoner)",
  },
  google: {
    name: "Google AI Studio",
    shortName: "Google AI",
    baseUrl: "/proxy/google",
    apiKey: (import.meta.env.STORYBOOK_GOOGLE_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: "~46 (Gemini models via OpenAI-compatible endpoint)",
  },
  sambanova: {
    name: "SambaNova",
    shortName: "SambaNova",
    baseUrl: "/proxy/sambanova",
    apiKey: (import.meta.env.STORYBOOK_SAMBANOVA_KEY as string) ?? "",
    requiresKey: true,
    expectedModels: "~17 (text models with pricing)",
  },
  helicone: {
    name: "Helicone",
    shortName: "Helicone",
    baseUrl: "/proxy/helicone",
    apiKey: (import.meta.env.STORYBOOK_HELICONE_KEY as string) ?? "",
    requiresKey: false,
    expectedModels: "~106 (OpenAI proxy, type inferred from ID)",
  },
  vercel: {
    name: "Vercel AI Gateway",
    shortName: "Vercel",
    baseUrl: "/proxy/vercel",
    apiKey: (import.meta.env.STORYBOOK_VERCEL_KEY as string) ?? "",
    requiresKey: false,
    expectedModels: '~194 (language, embedding, image — explicit type field)',
  },
};

// ─── Shared Render Helpers ───────────────────────────────────────────────────

function ProviderInfo({
  provider,
  value,
  requiresKey,
  hasKey,
  expectedModels,
}: {
  provider: string;
  value: string;
  requiresKey?: boolean;
  hasKey?: boolean;
  expectedModels?: string;
}) {
  return (
    <div style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
      <p>
        Provider: <code>{provider}</code>
      </p>
      <p>
        Selected: <code>{value || "none"}</code>
      </p>
      {expectedModels && (
        <p>
          Expected: <code>{expectedModels}</code>
        </p>
      )}
      {requiresKey && !hasKey && (
        <p style={{ color: "#c9a227", marginTop: 4 }}>
          ⚠️ Requires API key — add it to <code>.env</code> and restart Storybook.
        </p>
      )}
      {requiresKey && hasKey && (
        <p style={{ color: "#4ade80", marginTop: 4 }}>
          ✅ API key loaded from <code>.env</code>
        </p>
      )}
    </div>
  );
}

function SelectedModelDetail({ model }: { model: AnyModel | null }) {
  if (!model) return null;
  return (
    <pre
      style={{
        marginTop: 8,
        fontSize: 10,
        color: "#888",
        whiteSpace: "pre-wrap",
        maxHeight: 200,
        overflow: "auto",
      }}
    >
      {JSON.stringify(model, null, 2)}
    </pre>
  );
}

// ─── Story Factory ───────────────────────────────────────────────────────────

/**
 * Renders a single provider story: a `ModelSelector` (optionally type-filtered),
 * provider info badge, and an optional selected-model JSON detail panel.
 */
function ProviderStoryRenderer({
  providerKey,
  type,
  showDetail = false,
}: {
  providerKey: string;
  type?: ModelType;
  showDetail?: boolean;
}) {
  const p = PROVIDERS[providerKey];
  const [value, setValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<AnyModel | null>(null);
  const typeLabel = type ? ` ${type}` : "";
  const placeholder = `Select${typeLabel} model (${p.shortName})...`;

  return (
    <>
      <ModelSelector
        baseUrl={p.baseUrl}
        apiKey={p.apiKey || undefined}
        {...(p.queryParams ? { queryParams: p.queryParams } : {})}
        {...(type ? { type } : {})}
        value={value}
        onChange={(id, model) => {
          setValue(id);
          setSelectedModel(model);
        }}
        placeholder={placeholder}
      />
      <ProviderInfo
        provider={p.name}
        value={value}
        requiresKey={p.requiresKey}
        hasKey={!!p.apiKey}
        expectedModels={type ? undefined : p.expectedModels}
      />
      {showDetail && <SelectedModelDetail model={selectedModel} />}
    </>
  );
}

/**
 * Creates a Storybook story object for a provider.
 *
 * @param providerKey - Key into the `PROVIDERS` config object
 * @param options.type - Filter to a specific model type (omit for all types)
 * @param options.showDetail - Show the selected model's full JSON (default: false)
 */
function createProviderStory(
  providerKey: string,
  options?: { type?: ModelType; showDetail?: boolean },
): Story {
  return {
    render: () => (
      <ProviderStoryRenderer
        providerKey={providerKey}
        type={options?.type}
        showDetail={options?.showDetail}
      />
    ),
  };
}

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta<typeof ModelSelector> = {
  title: "Live Providers",
  component: ModelSelector,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof ModelSelector>;

// ═══════════════════════════════════════════════════════════════════════════════
// FREE PROVIDERS (no API key required)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Venice AI ───────────────────────────────────────────────────────────────

/** Venice.ai — All model types. No API key required. Uses `queryParams={{ type: "all" }}` to return non-text models. */
export const VeniceAllTypes: Story = createProviderStory("venice", { showDetail: true });

/** Venice.ai — Text models only. */
export const VeniceTextModels: Story = createProviderStory("venice", { type: "text" });

/** Venice.ai — Image models only. */
export const VeniceImageModels: Story = createProviderStory("venice", { type: "image" });

/** Venice.ai — Video models only. */
export const VeniceVideoModels: Story = createProviderStory("venice", { type: "video" });

// ─── OpenRouter ──────────────────────────────────────────────────────────────

/** OpenRouter — All models. No API key required for model discovery. ~340+ models from multiple providers. */
export const OpenRouterAllTypes: Story = createProviderStory("openrouter", { showDetail: true });

/** OpenRouter — Text models only. */
export const OpenRouterTextModels: Story = createProviderStory("openrouter", { type: "text" });

/** OpenRouter — Image models only. Detects image models via `architecture.output_modalities`. */
export const OpenRouterImageModels: Story = createProviderStory("openrouter", { type: "image" });

// ─── Helicone ────────────────────────────────────────────────────────────────

/** Helicone — OpenAI proxy gateway. No API key required for model listing. ~106 models. */
export const HeliconeAllTypes: Story = createProviderStory("helicone");

// ─── Vercel AI Gateway ───────────────────────────────────────────────────────

/** Vercel AI Gateway — All models. No API key required. ~194 models with explicit `type` field (language/embedding/image). */
export const VercelAllTypes: Story = createProviderStory("vercel", { showDetail: true });

/** Vercel AI Gateway — Text models only. */
export const VercelTextModels: Story = createProviderStory("vercel", { type: "text" });

/** Vercel AI Gateway — Image models only. */
export const VercelImageModels: Story = createProviderStory("vercel", { type: "image" });

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY REQUIRED PROVIDERS
// Keys are auto-loaded from .env — add your keys there and restart Storybook.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Together AI ─────────────────────────────────────────────────────────────

/** Together AI — All models. Requires API key. ~260 models with explicit `type` field (chat/image/video/audio/embedding). */
export const TogetherAllTypes: Story = createProviderStory("together", { showDetail: true });

/** Together AI — Text models only. */
export const TogetherTextModels: Story = createProviderStory("together", { type: "text" });

/** Together AI — Image models only. */
export const TogetherImageModels: Story = createProviderStory("together", { type: "image" });

/** Together AI — Video models only. */
export const TogetherVideoModels: Story = createProviderStory("together", { type: "video" });

// ─── OpenAI ──────────────────────────────────────────────────────────────────

/** OpenAI — All models. Requires API key. ~120 models. Type inferred from model ID (gpt-image, dall-e, tts, whisper, text-embedding). */
export const OpenAIAllTypes: Story = createProviderStory("openai", { showDetail: true });

/** OpenAI — Text models only. */
export const OpenAITextModels: Story = createProviderStory("openai", { type: "text" });

// ─── Mistral AI ──────────────────────────────────────────────────────────────

/** Mistral AI — All models. Requires API key. ~57 models. Uses `type: "base"` for all; embedding detected via ID. */
export const MistralAllTypes: Story = createProviderStory("mistral", { showDetail: true });

// ─── Groq ────────────────────────────────────────────────────────────────────

/** Groq — All models. Requires API key. ~20 models. Fast inference provider. */
export const GroqAllTypes: Story = createProviderStory("groq");

// ─── Nvidia NIM ──────────────────────────────────────────────────────────────

/** Nvidia NIM — All models. Requires API key. ~186 models. Type inferred from ID (embedqa, nv-embed, etc.). */
export const NvidiaAllTypes: Story = createProviderStory("nvidia");

// ─── Cerebras ────────────────────────────────────────────────────────────────

/** Cerebras — All models. Requires API key. ~4 models. Ultra-fast inference. */
export const CerebrasAllTypes: Story = createProviderStory("cerebras");

// ─── DeepSeek ────────────────────────────────────────────────────────────────

/** DeepSeek — All models. Requires API key. ~2 models (deepseek-chat, deepseek-reasoner). */
export const DeepSeekAllTypes: Story = createProviderStory("deepseek");

// ─── Google AI Studio ────────────────────────────────────────────────────────

/** Google AI Studio (Gemini) — All models. Requires API key. ~46 models. Uses OpenAI-compatible endpoint. */
export const GoogleAIAllTypes: Story = createProviderStory("google");

// ─── SambaNova ───────────────────────────────────────────────────────────────

/** SambaNova — All models. Requires API key. ~17 models. Includes pricing data. */
export const SambaNovaAllTypes: Story = createProviderStory("sambanova");

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE-BY-SIDE COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════

/** Side-by-side comparison of free providers (Venice, OpenRouter, Vercel, Helicone). No API keys needed. */
export const FreeProviderComparison: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 800, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [veniceValue, setVeniceValue] = useState("");
    const [openrouterValue, setOpenrouterValue] = useState("");
    const [vercelValue, setVercelValue] = useState("");
    const [heliconeValue, setHeliconeValue] = useState("");

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#ccc" }}>
            Venice AI
          </h4>
          <ModelSelector
            baseUrl={PROVIDERS.venice.baseUrl}
            apiKey={PROVIDERS.venice.apiKey || undefined}
            queryParams={PROVIDERS.venice.queryParams}
            value={veniceValue}
            onChange={setVeniceValue}
            placeholder="Venice..."
          />
          <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            Selected: <code>{veniceValue || "none"}</code>
          </p>
        </div>

        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#ccc" }}>
            OpenRouter
          </h4>
          <ModelSelector
            baseUrl={PROVIDERS.openrouter.baseUrl}
            apiKey={PROVIDERS.openrouter.apiKey || undefined}
            value={openrouterValue}
            onChange={setOpenrouterValue}
            placeholder="OpenRouter..."
          />
          <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            Selected: <code>{openrouterValue || "none"}</code>
          </p>
        </div>

        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#ccc" }}>
            Vercel AI Gateway
          </h4>
          <ModelSelector
            baseUrl={PROVIDERS.vercel.baseUrl}
            apiKey={PROVIDERS.vercel.apiKey || undefined}
            value={vercelValue}
            onChange={setVercelValue}
            placeholder="Vercel..."
          />
          <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            Selected: <code>{vercelValue || "none"}</code>
          </p>
        </div>

        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#ccc" }}>
            Helicone
          </h4>
          <ModelSelector
            baseUrl={PROVIDERS.helicone.baseUrl}
            apiKey={PROVIDERS.helicone.apiKey || undefined}
            value={heliconeValue}
            onChange={setHeliconeValue}
            placeholder="Helicone..."
          />
          <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            Selected: <code>{heliconeValue || "none"}</code>
          </p>
        </div>
      </div>
    );
  },
};
