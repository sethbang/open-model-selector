import type { StorybookConfig } from '@storybook/react-vite';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Shared .env parser (CJS) — see scripts/parse-env.cjs for implementation
const parseEnvContent: (content: string) => Record<string, string> =
  createRequire(import.meta.url)('../scripts/parse-env.cjs');

/**
 * Load .env file and return key-value pairs.
 * We need this because Vite only auto-loads VITE_* prefixed vars,
 * but our .env uses provider-specific names (OPENAI_API_KEY, etc.).
 */
function loadEnvFile(): Record<string, string> {
  const envPath = join(__dirname, '..', '.env');
  if (!existsSync(envPath)) return {};
  return parseEnvContent(readFileSync(envPath, 'utf-8'));
}

// Provider proxy definitions — maps local path prefix to upstream origin
const PROVIDER_PROXIES: Record<string, { target: string; pathRewrite: string }> = {
  '/proxy/venice':    { target: 'https://api.venice.ai',                          pathRewrite: '/api/v1' },
  '/proxy/openrouter':{ target: 'https://openrouter.ai',                          pathRewrite: '/api/v1' },
  '/proxy/together':  { target: 'https://api.together.xyz',                       pathRewrite: '/v1' },
  '/proxy/openai':    { target: 'https://api.openai.com',                         pathRewrite: '/v1' },
  '/proxy/mistral':   { target: 'https://api.mistral.ai',                         pathRewrite: '/v1' },
  '/proxy/groq':      { target: 'https://api.groq.com',                           pathRewrite: '/openai/v1' },
  '/proxy/nvidia':    { target: 'https://integrate.api.nvidia.com',               pathRewrite: '/v1' },
  '/proxy/cerebras':  { target: 'https://api.cerebras.ai',                        pathRewrite: '/v1' },
  '/proxy/deepseek':  { target: 'https://api.deepseek.com',                       pathRewrite: '/v1' },
  '/proxy/google':    { target: 'https://generativelanguage.googleapis.com',      pathRewrite: '/v1beta/openai' },
  '/proxy/sambanova': { target: 'https://api.sambanova.ai',                       pathRewrite: '/v1' },
  '/proxy/helicone':  { target: 'https://ai-gateway.helicone.ai',                 pathRewrite: '/v1' },
  '/proxy/vercel':    { target: 'https://ai-gateway.vercel.sh',                   pathRewrite: '/v1' },
};

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/react-vite",

  async viteFinal(config) {
    const envVars = loadEnvFile();

    // Expose API keys as import.meta.env.STORYBOOK_* via Vite's define
    config.define = config.define || {};
    const keyMap: Record<string, string> = {
      OPENROUTER_API_KEY: 'STORYBOOK_OPENROUTER_KEY',
      OPENAI_API_KEY:     'STORYBOOK_OPENAI_KEY',
      VENICE_API_KEY:     'STORYBOOK_VENICE_KEY',
      TOGETHER_API_KEY:   'STORYBOOK_TOGETHER_KEY',
      GROQ_API_KEY:       'STORYBOOK_GROQ_KEY',
      CEREBRAS_API_KEY:   'STORYBOOK_CEREBRAS_KEY',
      MISTRAL_API_KEY:    'STORYBOOK_MISTRAL_KEY',
      DEEPSEEK_API_KEY:   'STORYBOOK_DEEPSEEK_KEY',
      GOOGLE_AI_API_KEY:  'STORYBOOK_GOOGLE_KEY',
      NVIDIA_API_KEY:     'STORYBOOK_NVIDIA_KEY',
      SAMBANOVA_API_KEY:  'STORYBOOK_SAMBANOVA_KEY',
      HELICONE_API_KEY:   'STORYBOOK_HELICONE_KEY',
      VERCEL_API_KEY:     'STORYBOOK_VERCEL_KEY',
    };

    for (const [envName, sbName] of Object.entries(keyMap)) {
      const val = envVars[envName] || '';
      config.define![`import.meta.env.${sbName}`] = JSON.stringify(val);
    }

    // Set up Vite dev server proxies to bypass CORS
    config.server = config.server || {};
    config.server.proxy = config.server.proxy || {};

    for (const [prefix, { target, pathRewrite }] of Object.entries(PROVIDER_PROXIES)) {
      config.server.proxy[prefix] = {
        target,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(prefix, pathRewrite),
        secure: true,
      };
    }

    return config;
  },
};
export default config;
