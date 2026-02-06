import { defineConfig } from 'tsup'

export default defineConfig({
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
})
