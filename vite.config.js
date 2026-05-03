/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: '/build-your-own-alu/',
  resolve: {
    alias: {
      // netlistsvg pulls in an old elkjs (v0.3) whose worker path bare-requires
      // 'webworker-threads' (a native Node module) and tries to load a worker
      // bundle the dev server can't serve. Force it to use the modern elkjs
      // we installed at the top level — it ships a self-contained browser
      // bundle with no Node-only deps.
      elkjs: fileURLToPath(new URL('./node_modules/elkjs/lib/elk.bundled.js', import.meta.url)),
      'webworker-threads': fileURLToPath(new URL('./src/ui/empty-stub.js', import.meta.url)),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  test: {},
});
