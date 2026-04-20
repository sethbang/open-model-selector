# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task                                                                      | Command                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Build (dual CJS/ESM + types, validates `"use client"` banner)             | `npm run build`                                                |
| Watch rebuild                                                             | `npm run dev`                                                  |
| Typecheck only                                                            | `npm run typecheck`                                            |
| Run all Vitest projects (unit + component + storybook/browser)            | `npm test`                                                     |
| Run a single test file                                                    | `npx vitest run src/utils/format.test.ts`                      |
| Filter a single test by name                                              | `npx vitest run -t "formats per-token price"`                  |
| Single Vitest project                                                     | `npx vitest run --project unit` (or `component` / `storybook`) |
| Storybook dev                                                             | `npm run storybook` (port 6006)                                |
| Capture real provider `/models` responses into `test-fixtures/providers/` | `node scripts/capture-provider-snapshots.cjs` (reads `.env`)   |

Running `npm test` uses three Vitest projects configured in `vitest.config.ts`:

- `unit` — Node env, matches `src/**/*.test.ts`
- `component` — jsdom env, matches `src/**/*.test.tsx`, setup at `vitest.component-setup.ts`
- `storybook` — Playwright/chromium browser, runs `*.stories.tsx` as tests via `@storybook/addon-vitest`. Requires `npx playwright install chromium` locally; CI installs it explicitly.

`npm run prepublishOnly` and `preversion` chain typecheck → test → build. `npm version` is gated by `scripts/check-changelog.cjs`, which requires a `## [<new-version>]` section in `CHANGELOG.md` between the last tag and HEAD.

## Architecture

This is a published React library (`open-model-selector` on npm). It exports a model-picker combobox and the normalization plumbing behind it. Two build targets matter:

**Two entry points with different RSC semantics** — configured in `tsup.config.ts`:

1. `src/index.ts` → `dist/index.{js,cjs}` — all React component modules. tsup prepends `"use client";` on the **ESM** build only; `scripts/validate-use-client.cjs` asserts the directive is present at the top of every non-utils `.js` chunk in `dist/`. The CJS build intentionally does not emit the directive (esbuild would place it after the runtime preamble, making it a no-op) — modern bundlers resolve ESM via the `exports` map, and emitting a misleading no-op was worse than being silent.
2. `src/utils/index.ts` → `dist/utils.{js,cjs}` — **no** `"use client"`. This is the RSC-safe sub-path (`open-model-selector/utils`). Anything that's safe to call in a Server Component (pure formatters, normalizers, type-inference helpers) lives under `src/utils/` and must remain free of React imports or `"use client"` modules. Do not move React code here, and do not import from `../components` or `../hooks` inside `src/utils/`.

If you add a new JS entry to the main tsup config, verify the banner ends up in the output (esbuild only emits the banner on entries, not on shared chunks — splitting is enabled).

### Normalizer pipeline

The public-facing flow is `fetch /models` → `responseExtractor` → `normalizer` per item → `AnyModel[]`. Both are pluggable via `<ModelSelector>` / `useModels` props.

- `defaultResponseExtractor` handles `{ data: [...] }`, `{ models: [...] }`, or a top-level array.
- `defaultModelNormalizer` in `src/utils/normalizers/index.ts` dispatches to per-type normalizers (`normalizeTextModel`, `normalizeImageModel`, …) using a **6-tier type resolution** (commented in-file): canonical `raw.type` → non-text alias in `TYPE_ALIASES` → OpenRouter `architecture.output_modalities` → `inferTypeFromId` regex match (`src/utils/normalizers/type-inference.ts`) → text-aliased type (`chat`/`language`/`base`/`moderation`/`rerank` → `text`) → default `text`.
- Tier ordering is load-bearing: text aliases resolve _after_ the ID heuristic so e.g. Mistral's `mistral-embed` (whose `type` is `"base"`) is still classified as `embedding` via its ID rather than being swallowed by the `base`→`text` alias.

### Venice `model_spec` flattening

`extractBaseFields` (`src/utils/normalizers/base.ts`) reads both `raw.model_spec.*` (Venice's nested shape) and flat top-level fields, with `model_spec` winning for Venice-specific fields (`betaModel`, `privacy`, `offline`, `modelSource`, `traits`, `deprecation`). Per-type normalizers mirror this pattern when reading pricing/capabilities/constraints. When adding support for a new provider, prefer composing `extractBaseFields` + per-type normalizer rather than writing a freestanding normalizer.

`is_favorite` is a **client-side overlay**, never returned by any API. All normalizers must default it to `false`; `<ModelSelector>` hydrates the real value from `localStorage` at render (or delegates to the caller via the controlled `onToggleFavorite` prop).

### Provider compatibility tests

`src/utils/normalizers/provider-compat.test.ts` runs `defaultModelNormalizer` against real captured `/models` responses stored in `test-fixtures/providers/*.json`. Each provider also has a `*.specimen.json` with hand-picked edge-case entries. To refresh fixtures against live APIs, put keys in `.env` (see `.env.example`) and run the capture script. When adding a new provider, add both a full snapshot and a specimen, then extend `TYPE_ALIASES` or `MODEL_ID_TYPE_PATTERNS` as needed rather than branching inside the normalizer.

### Storybook as testing harness

Stories in `src/components/*.stories.tsx` are executed as browser tests by Vitest. `provider-live.stories.tsx` hits real APIs through Vite dev-server proxies defined in `.storybook/main.ts` (`/proxy/openai`, `/proxy/venice`, …) — this is how CORS is bypassed for live-data stories. API keys are injected at build time as `import.meta.env.STORYBOOK_<PROVIDER>_KEY`; `.storybook/main.ts` maps the `.env` names to those Storybook-prefixed ones via `config.define`.

### CI matrix

`.github/workflows/ci.yml` runs the test suite against **React 18 and 19**. When editing component code, verify nothing depends on React 19-only APIs without a 18-compatible fallback. React 18 doesn't ship its own types, so `@types/react` is a devDep and the matrix downgrades it alongside `react` on the React-18 leg.

### Scoped styling

All CSS in `src/styles.css` is scoped under `.oms-reset` and uses the `--oms-` custom-property prefix. Variable values are space-separated HSL triplets (Shadcn convention) — they're wrapped in `hsl(...)` at use sites so alpha composition works (`hsl(var(--oms-accent) / 0.5)`). Do not add `:root`-level rules or hex/rgb values for theme variables.
