import { defineConfig } from 'tsup'

export default defineConfig([
  // Main bundle — includes React components, needs "use client"
  {
    entry: ['src/index.ts', 'src/styles.css'],
    format: ['cjs', 'esm'],
    dts: true,
    // ⚠ If additional JS entry points are added, verify "use client"
    // appears in all output chunks (esbuild banner only targets entries).
    splitting: true,
    sourcemap: false,
    banner: {
      js: '"use client";',
    },
    // Only ESM (.js) is validated — CJS (.cjs) has a known esbuild limitation
    // where the banner is placed after the CJS runtime preamble, making the
    // directive a no-op. Modern bundlers resolve ESM via the "exports" map,
    // so the CJS directive gap is not actionable.
    onSuccess: 'node scripts/validate-use-client.cjs',
    external: [
      'react',
      'react-dom',
      /^@radix-ui\//,
      'cmdk'
    ],
  },
  // Pure utilities — NO "use client", safe for RSC
  {
    entry: { utils: 'src/utils/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: false,
    external: [
      'react',
      'react-dom',
      /^@radix-ui\//,
      'cmdk'
    ],
  },
])
