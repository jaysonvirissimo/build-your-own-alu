import * as netlistsvg from 'netlistsvg';
import skinSvg from './netlist-skin.svg?raw';
import { chipDefToNetlist } from './netlist-converter.js';

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
      } catch {
        return; // unknown sub-chip mid-edit, etc.
      }
      let promise;
      try {
        promise = netlistsvg.render(skinSvg, netlist);
      } catch {
        return;
      }
      promise
        .then((svgString) => {
          if (token !== renderToken) return;
          container.innerHTML = makeResponsive(svgString);
        })
        .catch(() => {
          // Leave previous diagram in place rather than blanking on transient errors.
        });
    },
    showPlaceholder(message) {
      renderToken++;
      const p = document.createElement('div');
      p.className = 'circuit-diagram-placeholder';
      p.textContent = message;
      container.replaceChildren(p);
    },
  };
}

// netlistsvg's raw output is too small to read at native size (a single-gate
// chip is ~160 px wide, with ~10 px text). Scale uniformly by RENDER_SCALE and
// add a viewBox so the proportions stay correct. Large diagrams (ALU) overflow
// the diagram pane and scroll via the pane's existing overflow-x: auto.
const RENDER_SCALE = 1.6;

function makeResponsive(svgString) {
  return svgString.replace(
    /<svg([^>]*?)\swidth="([\d.]+)"\sheight="([\d.]+)"/,
    (_, attrs, w, h) => {
      const wn = Number(w);
      const hn = Number(h);
      return `<svg${attrs} width="${wn * RENDER_SCALE}" height="${hn * RENDER_SCALE}" viewBox="0 0 ${wn} ${hn}"`;
    },
  );
}

