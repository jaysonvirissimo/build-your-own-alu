const SVG_NS = 'http://www.w3.org/2000/svg';
const PIN_RADIUS = 5;
const BUBBLE_R = 4;

// Gate shapes defined at origin (0,0), 80x40 bounding box.
// Each shape has: body path, optional bubble, text center offset, input/output x offsets.
const GATE_SHAPES = {
  Not: {
    body: 'M 10,10 L 48,20 L 10,30 Z',
    bubble: { cx: 52, cy: 20 },
    hideLabel: true,
    inputX: 0, outputX: 56 + BUBBLE_R,
  },
  And: {
    body: 'M 0,0 H 50 A 20,20 0 0,1 50,40 H 0 Z',
    bubble: null,
    textX: 30, textY: 20,
    inputX: 0, outputX: 70,
  },
  Nand: {
    body: 'M 0,0 H 44 A 20,20 0 0,1 44,40 H 0 Z',
    bubble: { cx: 68, cy: 20 },
    textX: 27, textY: 20,
    inputX: 0, outputX: 72 + BUBBLE_R,
  },
  Or: {
    body: 'M 8,0 C 30,0 55,8 76,20 C 55,32 30,40 8,40 C 20,30 20,10 8,0',
    bubble: null,
    textX: 35, textY: 20,
    inputX: 14, outputX: 76,
  },
  Nor: {
    body: 'M 8,0 C 30,0 50,8 68,20 C 50,32 30,40 8,40 C 20,30 20,10 8,0',
    bubble: { cx: 72, cy: 20 },
    textX: 32, textY: 20,
    inputX: 14, outputX: 76 + BUBBLE_R,
  },
  Xor: {
    body: 'M 12,0 C 34,0 58,8 76,20 C 58,32 34,40 12,40 C 24,30 24,10 12,0',
    extra: 'M 6,0 C 18,10 18,30 6,40',
    bubble: null,
    textX: 38, textY: 20,
    inputX: 14, outputX: 76,
  },
};

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

  const nodeMap = new Map(layout.nodes.map((n) => [n.id, n]));

  // Render edges first (behind nodes)
  const labeledWires = new Set();

  for (const edge of layout.edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;

    const [x1, y1] = getPort(fromNode, 'output', edge.fromPin);
    const [x2, y2] = getPort(toNode, 'input', edge.toPin);
    const midX = (x1 + x2) / 2;

    const path = svgEl('path', {
      d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
      class: 'wire',
    });
    svg.appendChild(path);

    if (edge.label && !labeledWires.has(edge.label)) {
      labeledWires.add(edge.label);
      const labelX = y1 === y2 ? (x1 + x2) / 2 : (x1 + midX) / 2;
      const labelY = y1 - 12;
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
  const shape = GATE_SHAPES[node.label];

  if (shape) {
    // Conventional gate shape
    const g = svgEl('g', { transform: `translate(${node.x}, ${node.y})` });

    const body = svgEl('path', { d: shape.body, class: 'gate-box' });
    g.appendChild(body);

    if (shape.extra) {
      const extra = svgEl('path', { d: shape.extra, class: 'gate-box' });
      extra.setAttribute('fill', 'none');
      g.appendChild(extra);
    }

    if (shape.bubble) {
      const bubble = svgEl('circle', {
        cx: shape.bubble.cx, cy: shape.bubble.cy, r: BUBBLE_R,
        class: 'gate-box',
      });
      g.appendChild(bubble);
    }

    if (!shape.hideLabel) {
      const text = svgEl('text', {
        x: shape.textX, y: shape.textY,
        class: 'gate-label',
      });
      text.textContent = node.label;
      g.appendChild(text);
    }

    svg.appendChild(g);
  } else {
    // Fallback: rectangle
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
  }

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
      text.textContent = `${label}\u2192${c.pin}`;
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

function getPort(node, side, pinName) {
  if (node.type === 'gate') {
    const w = node.w || 80;
    const h = node.h || 40;
    const shape = GATE_SHAPES[node.label];

    if (side === 'input') {
      const pins = node.inputPins || [];
      const idx = pinName ? pins.indexOf(pinName) : 0;
      const count = pins.length || 1;
      const portY = node.y + (idx + 1) * (h / (count + 1));
      const portX = node.x + (shape ? shape.inputX : 0);
      return [portX, portY];
    }

    // output
    const pins = node.outputPins || [];
    const idx = pinName ? pins.indexOf(pinName) : 0;
    const count = pins.length || 1;
    const portY = node.y + (idx + 1) * (h / (count + 1));
    const portX = node.x + (shape ? shape.outputX : w);
    return [portX, portY];
  }

  // Pin node
  return [node.x, node.y];
}
