import { computeLayout } from './circuit-layout.js';
import { renderCircuitSVG } from './circuit-render.js';

export function createCircuitDiagram(chipDef, registry) {
  const layout = computeLayout(chipDef, registry);
  const svg = renderCircuitSVG(layout);

  const container = document.createElement('div');
  container.className = 'circuit-diagram';
  container.appendChild(svg);
  return container;
}
