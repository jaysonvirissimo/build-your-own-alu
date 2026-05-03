// Convert a parsed HDL chipDef + ChipRegistry into a Yosys-style netlist JSON
// suitable for netlistsvg.render(). The output shape matches netlistsvg's
// YosysModel: { modules: { [name]: { ports, cells, netnames } } }.
//
// Wires are represented as bit-ID arrays. Bit IDs are integers starting at 2;
// "0" and "1" (strings) are reserved for constant low/high signals per Yosys
// convention.

// Chips with more parts than this render as a single labeled black box
// instead of expanding every internal gate. Matches the threshold used by the
// previous hand-rolled layout (deleted circuit-layout.js). Above ~10 parts the
// layout becomes too dense to read at the diagram pane's typical width, and
// the educational value of seeing every internal wire drops off.
const COLLAPSE_THRESHOLD = 10;

// Maps known HDL chip names to Yosys gate primitives. Cells of these types
// render with conventional schematic symbols from netlistsvg's default skin.
// Pin-name mapping converts our HDL pin names to the symbol's expected pids.
const PRIMITIVE_MAP = {
  Nand: { type: '$_NAND_', pinMap: { a: 'A', b: 'B', out: 'Y' } },
  And:  { type: '$_AND_',  pinMap: { a: 'A', b: 'B', out: 'Y' } },
  Or:   { type: '$_OR_',   pinMap: { a: 'A', b: 'B', out: 'Y' } },
  Xor:  { type: '$_XOR_',  pinMap: { a: 'A', b: 'B', out: 'Y' } },
  Nor:  { type: '$_NOR_',  pinMap: { a: 'A', b: 'B', out: 'Y' } },
  Not:  { type: '$_NOT_',  pinMap: { in: 'A', out: 'Y' } },
  Mux:  { type: '$_MUX_',  pinMap: { a: 'A', b: 'B', sel: 'S', out: 'Y' } },
};

export function chipDefToNetlist(chipDef, registry) {
  const wireWidths = inferWireWidths(chipDef, registry);
  const wireBits = assignBitIds(chipDef, wireWidths);

  const ports = {};
  for (const pin of chipDef.inputs) {
    ports[pin.name] = { direction: 'input', bits: [...wireBits.get(pin.name)] };
  }
  for (const pin of chipDef.outputs) {
    ports[pin.name] = { direction: 'output', bits: [...wireBits.get(pin.name)] };
  }

  if (chipDef.parts.length > COLLAPSE_THRESHOLD) {
    return collapsedNetlist(chipDef, ports, wireBits);
  }

  const cells = {};
  chipDef.parts.forEach((part, i) => {
    const subChip = registry.get(part.chipName);
    const primitive = PRIMITIVE_MAP[part.chipName];
    const renamePin = (name) => (primitive ? (primitive.pinMap[name] ?? name) : name);

    const subInputs = new Map(subChip.inputs.map((p) => [p.name, p]));
    const subOutputs = new Map(subChip.outputs.map((p) => [p.name, p]));

    // Initialize per-pin bit arrays. Each sub-pin gets a slot for every bit
    // of its declared width; a sub-pin may receive bits from multiple
    // connections (e.g. b[0]=true, b[1]=true, b[2]=in[0]).
    const portBits = new Map();
    for (const sub of subChip.inputs) portBits.set(sub.name, new Array(sub.width).fill(undefined));
    for (const sub of subChip.outputs) portBits.set(sub.name, new Array(sub.width).fill(undefined));

    for (const conn of part.connections) {
      const subPinDef = subInputs.get(conn.subPin) ?? subOutputs.get(conn.subPin);
      if (!subPinDef) continue; // unknown pin — let validation elsewhere catch it
      const slots = portBits.get(conn.subPin);

      const subRange = sliceRange(conn.subBus, subPinDef.width);

      let bits;
      if (conn.isConstant) {
        const val = conn.wire === 'true' ? '1' : '0';
        bits = new Array(subRange.length).fill(val);
      } else {
        const allBits = wireBits.get(conn.wire) ?? [];
        const wireRange = sliceRange(conn.wireBus, allBits.length);
        bits = wireRange.map((idx) => allBits[idx]).filter((b) => b !== undefined);
      }

      // Drop bits into their sub-pin slots. Sub-range tells us where they
      // land within the sub-pin's bit array.
      for (let k = 0; k < Math.min(subRange.length, bits.length); k++) {
        slots[subRange[k]] = bits[k];
      }
    }

    const port_directions = {};
    const connections = {};
    for (const sub of subChip.inputs) {
      const slots = portBits.get(sub.name);
      if (slots.every((b) => b === undefined)) continue;
      const renamed = renamePin(sub.name);
      port_directions[renamed] = 'input';
      connections[renamed] = slots.map((b) => (b === undefined ? 'x' : b));
    }
    for (const sub of subChip.outputs) {
      const slots = portBits.get(sub.name);
      if (slots.every((b) => b === undefined)) continue;
      const renamed = renamePin(sub.name);
      port_directions[renamed] = 'output';
      connections[renamed] = slots.map((b) => (b === undefined ? 'x' : b));
    }

    const cellKey = `${part.chipName}$${i}`;
    cells[cellKey] = {
      type: primitive ? primitive.type : part.chipName,
      port_directions,
      connections,
    };
  });

  const netnames = {};
  for (const [name, bits] of wireBits) {
    netnames[name] = { bits: [...bits], hide_name: 0, attributes: {} };
  }

  return {
    modules: {
      [chipDef.name]: { ports, cells, netnames },
    },
  };
}

// Mirrors the wire-width inference in src/hdl/simulator.js: chip-level pins
// have explicit widths; internal wires take their width from whatever sub-pin
// drives them (with bus indexing/slicing taken into account). Reads from a
// bus index/slice also lower-bound the wire's width — well-formed HDL won't
// rely on this, but it keeps the converter robust to partially-typed code.
function inferWireWidths(chipDef, registry) {
  const widths = new Map();
  const bumpWidth = (name, w) => {
    const existing = widths.get(name);
    if (existing === undefined || w > existing) widths.set(name, w);
  };

  for (const pin of chipDef.inputs) widths.set(pin.name, pin.width);
  for (const pin of chipDef.outputs) widths.set(pin.name, pin.width);

  for (const part of chipDef.parts) {
    const subChip = registry.get(part.chipName);
    if (!subChip) continue;
    const subInputs = new Map(subChip.inputs.map((p) => [p.name, p]));
    const subOutputs = new Map(subChip.outputs.map((p) => [p.name, p]));

    for (const conn of part.connections) {
      if (conn.isConstant) continue;

      const subOut = subOutputs.get(conn.subPin);
      if (subOut) {
        // Output connection: this part drives `conn.wire`, so the wire must
        // be at least as wide as what's being written.
        let width;
        if (conn.wireBus !== null) {
          width = 'index' in conn.wireBus ? conn.wireBus.index + 1 : conn.wireBus.end + 1;
        } else if (conn.subBus !== null) {
          width = 'index' in conn.subBus ? 1 : conn.subBus.end - conn.subBus.start + 1;
        } else {
          width = subOut.width;
        }
        bumpWidth(conn.wire, width);
        continue;
      }

      const subIn = subInputs.get(conn.subPin);
      if (subIn && conn.wireBus !== null) {
        // Sliced read: the wire must contain the bit being read.
        const minWidth = 'index' in conn.wireBus
          ? conn.wireBus.index + 1
          : conn.wireBus.end + 1;
        bumpWidth(conn.wire, minWidth);
      }
    }
  }
  return widths;
}

function assignBitIds(chipDef, widths) {
  const wireBits = new Map();
  let next = 2; // 0 and 1 are reserved for constant low/high

  // Assign in a stable order: chip inputs, chip outputs, then any other wires
  // discovered in part connections.
  const order = [];
  const seen = new Set();
  const add = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    order.push(name);
  };
  chipDef.inputs.forEach((p) => add(p.name));
  chipDef.outputs.forEach((p) => add(p.name));
  for (const part of chipDef.parts) {
    for (const conn of part.connections) {
      if (!conn.isConstant) add(conn.wire);
    }
  }

  for (const name of order) {
    const w = widths.get(name) ?? 1;
    const bits = [];
    for (let i = 0; i < w; i++) bits.push(next++);
    wireBits.set(name, bits);
  }
  return wireBits;
}

// For chips above COLLAPSE_THRESHOLD parts, emit a single black-box cell
// rather than expanding every internal gate. The cell's type is the chip
// name and its ports mirror the chip's own inputs/outputs, so each chip
// input/output port wires straight through to the corresponding cell pin.
function collapsedNetlist(chipDef, ports, wireBits) {
  const port_directions = {};
  const connections = {};
  for (const pin of chipDef.inputs) {
    port_directions[pin.name] = 'input';
    connections[pin.name] = [...wireBits.get(pin.name)];
  }
  for (const pin of chipDef.outputs) {
    port_directions[pin.name] = 'output';
    connections[pin.name] = [...wireBits.get(pin.name)];
  }
  const cells = {
    [`${chipDef.name}$0`]: {
      type: chipDef.name,
      port_directions,
      connections,
    },
  };
  const netnames = {};
  for (const [name, bits] of wireBits) {
    netnames[name] = { bits: [...bits], hide_name: 0, attributes: {} };
  }
  return { modules: { [chipDef.name]: { ports, cells, netnames } } };
}

// Convert a bus notation ({index} or {start, end} or null) into an array of
// bit positions within a pin/wire of the given width.
function sliceRange(bus, totalWidth) {
  if (bus === null || bus === undefined) {
    return Array.from({ length: totalWidth }, (_, i) => i);
  }
  if ('index' in bus) return [bus.index];
  const out = [];
  for (let i = bus.start; i <= bus.end; i++) out.push(i);
  return out;
}
