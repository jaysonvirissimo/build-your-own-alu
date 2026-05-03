import * as netlistsvg from 'netlistsvg';
import skinSvg from './netlist-skin.svg?raw';
import { chipDefToNetlist } from './netlist-converter.js';

// netlistsvg's raw SVG output is too small to read at native size — a single-
// gate chip is ~160 px wide with ~10 px text. Scale up uniformly while
// preserving aspect via viewBox. Large diagrams shrink to fit the pane (the
// converter collapses chips above its threshold so very wide diagrams are
// rare in practice).
const RENDER_SCALE = 1.6;

const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

export function createLiveDiagram() {
  const container = document.createElement('div');
  container.className = 'circuit-diagram';

  // Renders are async (ELK layout returns a Promise). A fast typist can fire
  // a second render before the first finishes; track a token so out-of-order
  // results get dropped instead of clobbering newer output.
  let renderToken = 0;

  return {
    container,
    update(chipDef, registry) {
      const token = ++renderToken;
      let netlist;
      try {
        netlist = chipDefToNetlist(chipDef, registry);
      } catch (err) {
        // Mid-edit HDL can reference unknown sub-chips; leave the previous
        // diagram in place and surface the error for debugging.
        console.error('[circuit-diagram] converter failed:', err);
        return;
      }
      let promise;
      try {
        promise = netlistsvg.render(skinSvg, netlist);
      } catch (err) {
        console.error('[circuit-diagram] netlistsvg.render threw:', err);
        return;
      }
      promise
        .then((svgString) => {
          if (token !== renderToken) return; // stale
          const svg = parseAndScale(svgString);
          if (svg) container.replaceChildren(svg);
        })
        .catch((err) => {
          console.error('[circuit-diagram] render rejected:', err);
        });
    },
    showPlaceholder(message) {
      renderToken++; // invalidate any in-flight render
      const p = document.createElement('div');
      p.className = 'circuit-diagram-placeholder';
      p.textContent = message;
      container.replaceChildren(p);
    },
  };
}

// Parse the raw SVG string, then rewrite the root element's width/height to
// add a viewBox and scale up. Using DOMParser instead of innerHTML keeps any
// unexpected markup contained — script tags inside an SVG document parsed
// with image/svg+xml don't execute on insertion.
function parseAndScale(svgString) {
  if (!parser) return null;
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.nodeName !== 'svg') return null;

  const w = Number(svg.getAttribute('width'));
  const h = Number(svg.getAttribute('height'));
  if (Number.isFinite(w) && Number.isFinite(h)) {
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', String(w * RENDER_SCALE));
    svg.setAttribute('height', String(h * RENDER_SCALE));
  }
  // Adopt into the host document so the element belongs to our DOM.
  return document.importNode(svg, true);
}
