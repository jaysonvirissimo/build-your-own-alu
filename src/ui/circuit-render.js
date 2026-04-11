const SVG_NS = 'http://www.w3.org/2000/svg';
const PIN_RADIUS = 5;

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

export function renderCircuitSVG(layout) {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${layout.viewBox.width} ${layout.viewBox.height}`,
    xmlns: SVG_NS,
  });

  // Render edges first (behind nodes)
  const nodeMap = new Map(layout.nodes.map((n) => [n.id, n]));

  for (const edge of layout.edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;

    const [x1, y1] = getPort(fromNode, 'right');
    const [x2, y2] = getPort(toNode, 'left');
    const midX = (x1 + x2) / 2;

    const path = svgEl('path', {
      d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
      class: 'wire',
    });
    svg.appendChild(path);

    // Wire label at midpoint
    if (edge.label) {
      const labelX = midX;
      const labelY = y1 === y2 ? y1 - 8 : (y1 + y2) / 2 - 8;
      const text = svgEl('text', {
        x: labelX, y: labelY,
        class: 'wire-label',
        'text-anchor': 'middle',
      });
      text.textContent = edge.label;
      svg.appendChild(text);
    }
  }

  // Render nodes
  for (const node of layout.nodes) {
    if (node.type === 'gate') {
      renderGate(svg, node);
    } else {
      renderPin(svg, node);
    }
  }

  return svg;
}

function renderGate(svg, node) {
  const w = node.w || 80;
  const h = node.h || 40;

  const rect = svgEl('rect', {
    x: node.x, y: node.y, width: w, height: h,
    rx: 4,
    class: 'gate-box',
  });
  svg.appendChild(rect);

  const text = svgEl('text', {
    x: node.x + w / 2, y: node.y + h / 2,
    class: 'gate-label',
  });
  text.textContent = node.label;
  svg.appendChild(text);

  // Render constants
  if (node.constants && node.constants.length > 0) {
    node.constants.forEach((c, i) => {
      const label = c.value === 'true' ? 'T' : 'F';
      const cy = node.y + (i + 1) * (h / (node.constants.length + 1));
      const text = svgEl('text', {
        x: node.x - 8, y: cy,
        class: 'constant-label',
        'text-anchor': 'end',
        'dominant-baseline': 'central',
      });
      text.textContent = `${label}→${c.pin}`;
      svg.appendChild(text);
    });
  }
}

function renderPin(svg, node) {
  const circle = svgEl('circle', {
    cx: node.x, cy: node.y, r: PIN_RADIUS,
    class: 'pin-dot',
  });
  svg.appendChild(circle);

  const isInput = node.type === 'input';
  const labelText = node.width > 1 ? `${node.label}[${node.width}]` : node.label;
  const text = svgEl('text', {
    x: isInput ? node.x - 12 : node.x + 12,
    y: node.y,
    class: 'pin-label',
    'text-anchor': isInput ? 'end' : 'start',
    'dominant-baseline': 'central',
  });
  text.textContent = labelText;
  svg.appendChild(text);
}

function getPort(node, side) {
  if (node.type === 'gate') {
    const w = node.w || 80;
    const h = node.h || 40;
    if (side === 'left') return [node.x, node.y + h / 2];
    return [node.x + w, node.y + h / 2];
  }
  // Pin node — single point
  return [node.x, node.y];
}
