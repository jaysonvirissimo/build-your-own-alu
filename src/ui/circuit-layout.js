const COLUMN_WIDTH = 180;
const ROW_HEIGHT = 60;
const GATE_WIDTH = 80;
const GATE_HEIGHT = 40;
const PADDING = 40;
const COLLAPSE_THRESHOLD = 10;

export function computeLayout(chipDef, registry) {
  if (chipDef.parts.length > COLLAPSE_THRESHOLD) {
    return collapsedLayout(chipDef);
  }
  return expandedLayout(chipDef, registry);
}

function collapsedLayout(chipDef) {
  const gateW = 120;
  const gateH = Math.max(
    GATE_HEIGHT,
    Math.max(chipDef.inputs.length, chipDef.outputs.length) * 20 + 20
  );
  const centerX = PADDING + COLUMN_WIDTH;
  const centerY = PADDING + gateH / 2;

  const nodes = [];
  const edges = [];

  // Input pins
  chipDef.inputs.forEach((pin, i) => {
    const y = centerY - gateH / 2 + (i + 1) * (gateH / (chipDef.inputs.length + 1));
    nodes.push({
      id: `input:${pin.name}`, type: 'input', label: pin.name,
      width: pin.width, x: PADDING, y,
    });
    edges.push({
      from: `input:${pin.name}`, to: 'gate:0',
      label: pin.width > 1 ? `${pin.name}[${pin.width}]` : pin.name,
    });
  });

  // Single gate box
  nodes.push({
    id: 'gate:0', type: 'gate', label: chipDef.name,
    x: centerX - gateW / 2, y: centerY - gateH / 2, w: gateW, h: gateH,
  });

  // Output pins
  chipDef.outputs.forEach((pin, i) => {
    const y = centerY - gateH / 2 + (i + 1) * (gateH / (chipDef.outputs.length + 1));
    nodes.push({
      id: `output:${pin.name}`, type: 'output', label: pin.name,
      width: pin.width, x: centerX + gateW / 2 + COLUMN_WIDTH, y,
    });
    edges.push({
      from: 'gate:0', to: `output:${pin.name}`,
      label: pin.width > 1 ? `${pin.name}[${pin.width}]` : pin.name,
    });
  });

  const width = centerX + gateW / 2 + COLUMN_WIDTH + PADDING + 40;
  const height = gateH + PADDING * 2;
  return { nodes, edges, viewBox: { width, height } };
}

function expandedLayout(chipDef, registry) {
  const inputNames = new Set(chipDef.inputs.map((p) => p.name));
  const outputNames = new Set(chipDef.outputs.map((p) => p.name));

  // For each part, determine which wires it reads and writes
  const partReads = []; // index -> Set<wireName>
  const partWrites = []; // index -> Set<wireName>
  const wireWriter = new Map(); // wireName -> partIndex (which part drives it)

  for (let i = 0; i < chipDef.parts.length; i++) {
    const part = chipDef.parts[i];
    const subChip = registry.get(part.chipName);
    const subInputs = new Set(subChip.inputs.map((p) => p.name));
    const subOutputs = new Set(subChip.outputs.map((p) => p.name));

    const reads = new Set();
    const writes = new Set();
    const constants = [];

    for (const conn of part.connections) {
      if (subInputs.has(conn.subPin)) {
        if (conn.isConstant) {
          constants.push({ pin: conn.subPin, value: conn.wire });
        } else {
          reads.add(conn.wire);
        }
      }
      if (subOutputs.has(conn.subPin)) {
        writes.add(conn.wire);
        wireWriter.set(conn.wire, i);
      }
    }

    partReads.push(reads);
    partWrites.push(writes);
    chipDef.parts[i]._constants = constants;
  }

  // Topological sort into columns
  const partColumn = new Array(chipDef.parts.length).fill(0);
  // Iterate until stable
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < chipDef.parts.length; i++) {
      for (const wire of partReads[i]) {
        if (wireWriter.has(wire)) {
          const depIdx = wireWriter.get(wire);
          const newCol = partColumn[depIdx] + 1;
          if (newCol > partColumn[i]) {
            partColumn[i] = newCol;
            changed = true;
          }
        }
      }
    }
  }

  // Group parts by column
  const maxCol = Math.max(0, ...partColumn);
  const columns = Array.from({ length: maxCol + 1 }, () => []);
  for (let i = 0; i < chipDef.parts.length; i++) {
    columns[partColumn[i]].push(i);
  }

  // Position nodes
  const nodes = [];
  const partNodes = new Map(); // partIndex -> nodeId

  // Input pins (column -1)
  const inputCount = chipDef.inputs.length;
  chipDef.inputs.forEach((pin, i) => {
    nodes.push({
      id: `input:${pin.name}`, type: 'input', label: pin.name,
      width: pin.width,
      x: PADDING, y: PADDING + i * ROW_HEIGHT + ROW_HEIGHT / 2,
    });
  });

  // Gate nodes
  const maxRowCount = Math.max(inputCount, chipDef.outputs.length,
    ...columns.map((col) => col.length));

  for (let c = 0; c < columns.length; c++) {
    const col = columns[c];
    const colOffset = (maxRowCount - col.length) / 2;
    for (let r = 0; r < col.length; r++) {
      const partIdx = col[r];
      const part = chipDef.parts[partIdx];
      const x = PADDING + (c + 1) * COLUMN_WIDTH;
      const y = PADDING + (r + colOffset) * ROW_HEIGHT + (ROW_HEIGHT - GATE_HEIGHT) / 2;
      const nodeId = `part:${partIdx}`;
      partNodes.set(partIdx, nodeId);
      nodes.push({
        id: nodeId, type: 'gate', label: part.chipName,
        x, y, w: GATE_WIDTH, h: GATE_HEIGHT,
        constants: part._constants,
      });
    }
  }

  // Output pins
  const outputX = PADDING + (maxCol + 2) * COLUMN_WIDTH;
  const outputOffset = (maxRowCount - chipDef.outputs.length) / 2;
  chipDef.outputs.forEach((pin, i) => {
    nodes.push({
      id: `output:${pin.name}`, type: 'output', label: pin.name,
      width: pin.width,
      x: outputX, y: PADDING + (i + outputOffset) * ROW_HEIGHT + ROW_HEIGHT / 2,
    });
  });

  // Build edges
  const edges = [];
  const edgesSeen = new Set();

  for (let i = 0; i < chipDef.parts.length; i++) {
    const part = chipDef.parts[i];
    const subChip = registry.get(part.chipName);
    const subInputs = new Set(subChip.inputs.map((p) => p.name));
    const subOutputs = new Set(subChip.outputs.map((p) => p.name));

    for (const conn of part.connections) {
      if (conn.isConstant) continue;

      const wireName = conn.wire;

      if (subInputs.has(conn.subPin)) {
        // Wire feeding into this part — find source
        let fromId;
        if (inputNames.has(wireName)) {
          fromId = `input:${wireName}`;
        } else if (wireWriter.has(wireName)) {
          fromId = partNodes.get(wireWriter.get(wireName));
        }
        if (fromId) {
          const key = `${fromId}->${partNodes.get(i)}:${wireName}`;
          if (!edgesSeen.has(key)) {
            edgesSeen.add(key);
            edges.push({ from: fromId, to: partNodes.get(i), label: wireName });
          }
        }
      }

      if (subOutputs.has(conn.subPin) && outputNames.has(wireName)) {
        // Wire going to chip output
        const key = `${partNodes.get(i)}->output:${wireName}`;
        if (!edgesSeen.has(key)) {
          edgesSeen.add(key);
          edges.push({ from: partNodes.get(i), to: `output:${wireName}`, label: wireName });
        }
      }
    }
  }

  const width = outputX + PADDING + 40;
  const height = PADDING * 2 + maxRowCount * ROW_HEIGHT;
  return { nodes, edges, viewBox: { width, height } };
}
