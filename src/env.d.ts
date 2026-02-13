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
