import { computeLayout } from './circuit-layout.js';
import { renderCircuitSVG } from './circuit-render.js';

export function createLiveDiagram() {
  const container = document.createElement('div');
  container.className = 'circuit-diagram';
  return {
    container,
    update(chipDef, registry) {
      const layout = computeLayout(chipDef, registry);
      const svg = renderCircuitSVG(layout);
      container.replaceChildren(svg);
    },
    showPlaceholder(message) {
      const p = document.createElement('div');
      p.className = 'circuit-diagram-placeholder';
      p.textContent = message;
      container.replaceChildren(p);
    },
  };
}
