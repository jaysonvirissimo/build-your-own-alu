/// <reference types="vitest" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/build-your-own-alu/',
  resolve: {
    alias: {
      // netlistsvg pulls in an old elkjs (v0.3) whose worker path bare-requires
      // 'webworker-threads' (a native Node module) and tries to load a worker
      // bundle the dev server can't serve. Force it to use the modern elkjs
      // we installed at the top level — it ships a self-contained browser
      // bundle with no Node-only deps.
      elkjs: path.resolve(projectRoot, 'node_modules/elkjs/lib/elk.bundled.js'),
      'webworker-threads': path.resolve(projectRoot, 'build-shims/empty-stub.js'),
    },
  },
  build: {
    // The circuit-diagram renderer (netlistsvg + elkjs's full ELK layout
    // engine) is intrinsically heavy (~1.5 MB minified). It is dynamically
    // imported from src/ui/circuit-diagram.js, so it never loads on initial
    // page paint — only when the user types HDL that parses cleanly. We pin
    // it to a stably-named `diagram-renderer` chunk so its content hash is
    // tied to those libraries rather than to app-side churn (better cache
    // hit-rate for returning visitors), and raise the chunk-size warning
    // threshold above its expected size so the warning still fires if the
    // chunk grows unexpectedly.
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/netlistsvg')) return 'diagram-renderer';
          if (id.includes('node_modules/elkjs')) return 'diagram-renderer';
          if (id.includes('netlist-skin.svg')) return 'diagram-renderer';
        },
      },
    },
  },
  test: {},
});
