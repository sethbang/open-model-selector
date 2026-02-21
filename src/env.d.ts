/**
 * Ambient declaration for process.env.NODE_ENV.
 *
 * All major bundlers (Vite, webpack, esbuild, Rollup, etc.) replace
 * `process.env.NODE_ENV` at build time. This declaration provides type
 * safety without pulling in the full @types/node surface, which is
 * inappropriate for a browser-only library.
 */
declare const process: {
  env: {
    NODE_ENV: string
  }
}

/**
 * Vite import.meta.env declarations.
 *
 * Storybook injects STORYBOOK_* env vars via Vite's `define` config
 * (see .storybook/main.ts). These are only available in Storybook context.
 */
interface ImportMetaEnv {
  readonly STORYBOOK_VENICE_KEY: string
  readonly STORYBOOK_OPENROUTER_KEY: string
  readonly STORYBOOK_TOGETHER_KEY: string
  readonly STORYBOOK_OPENAI_KEY: string
  readonly STORYBOOK_MISTRAL_KEY: string
  readonly STORYBOOK_GROQ_KEY: string
  readonly STORYBOOK_NVIDIA_KEY: string
  readonly STORYBOOK_CEREBRAS_KEY: string
  readonly STORYBOOK_DEEPSEEK_KEY: string
  readonly STORYBOOK_GOOGLE_KEY: string
  readonly STORYBOOK_SAMBANOVA_KEY: string
  readonly STORYBOOK_HELICONE_KEY: string
  readonly STORYBOOK_VERCEL_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
