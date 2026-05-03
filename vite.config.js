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
  test: {},
});
