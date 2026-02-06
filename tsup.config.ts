import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/styles.css'],
  format: ['cjs', 'esm'],
  dts: true,
  declarationMap: true,
  clean: true,
  sourcemap: false,
  external: [
    'react',
    'react-dom',
    /^@radix-ui\//,
    'cmdk'
  ],
})
