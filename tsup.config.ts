import { defineConfig } from 'tsup'

export default defineConfig([
  // Main bundle — includes React components, needs "use client"
  {
    entry: ['src/index.ts', 'src/styles.css'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    banner: {
      js: '"use client";',
    },
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
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      /^@radix-ui\//,
      'cmdk'
    ],
  },
])
