import { defineConfig } from 'tsup'

export default defineConfig([
  // Main bundle (ESM) — includes React components. `"use client"` banner is
  // required so Next.js / RSC consumers don't accidentally hydrate client
  // components on the server.
  //
  // Why ESM-only for the banner:
  // esbuild places the banner *after* the CJS runtime preamble, which makes it
  // a no-op for CJS consumers — React doesn't recognize a "use client" directive
  // that isn't the first statement. Modern bundlers resolve ESM via the
  // "exports" map, so the ESM banner is what actually matters. We stopped
  // emitting the CJS banner entirely (rather than emitting a misleading no-op).
  {
    entry: ['src/index.ts', 'src/styles.css'],
    format: ['esm'],
    dts: true,
    // ⚠ If additional JS entry points are added, verify "use client"
    // appears in all output chunks (esbuild banner only targets entries).
    splitting: true,
    sourcemap: false,
    banner: { js: '"use client";' },
    onSuccess: 'node scripts/validate-use-client.cjs',
    external: ['react', 'react-dom', /^@radix-ui\//, 'cmdk'],
  },
  // Main bundle (CJS) — no banner (see rationale above).
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: true,
    splitting: true,
    sourcemap: false,
    external: ['react', 'react-dom', /^@radix-ui\//, 'cmdk'],
  },
  // Pure utilities — NO "use client", safe for RSC.
  {
    entry: { utils: 'src/utils/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: false,
    external: ['react', 'react-dom', /^@radix-ui\//, 'cmdk'],
  },
])
