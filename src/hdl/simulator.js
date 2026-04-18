import { SimError } from './errors.js';

export function simulate(chipDef, inputs, registry) {
  // Built-in chips have an evaluate function
  if (chipDef.builtin) {
    return chipDef.evaluate(inputs);
  }

  // Build wire width map from pin declarations
  const wireWidths = new Map();
  for (const pin of chipDef.inputs) {
    wireWidths.set(pin.name, pin.width);
  }
  for (const pin of chipDef.outputs) {
    wireWidths.set(pin.name, pin.width);
  }

  // Validate all parts reference known chips
  for (const part of chipDef.parts) {
    if (!registry.has(part.chipName)) {
      const available = registry.getAvailableNames().join(', ');
      throw new SimError(
        `Chip '${part.chipName}' is not available. Available chips: ${available}`,
        { line: part.line ?? null, col: part.col ?? null, kind: 'chip-missing' }
      );
    }
  }

  // Infer internal wire widths from output connections
  for (const part of chipDef.parts) {
    const subChip = registry.get(part.chipName);
    const subOutputMap = new Map(subChip.outputs.map((p) => [p.name, p]));
    for (const conn of part.connections) {
      if (conn.isConstant) continue;
      const subOut = subOutputMap.get(conn.subPin);
      if (!subOut) continue; // input connection, skip

      let width;
      if (conn.wireBus !== null) {
        if ('index' in conn.wireBus) {
          // Writing a single bit — wire must be at least index+1 wide
          width = conn.wireBus.index + 1;
        } else {
          width = conn.wireBus.end + 1;
        }
      } else {
        // Whole connection — wire width matches what's being written
        if (conn.subBus !== null) {
          width = 'index' in conn.subBus ? 1 : conn.subBus.end - conn.subBus.start + 1;
        } else {
          width = subOut.width;
        }
      }

      const existing = wireWidths.get(conn.wire);
      if (existing === undefined || width > existing) {
        wireWidths.set(conn.wire, width);
      }
    }
  }

  // Build wire map: input wires from inputs, everything else starts at 0
  const wires = new Map();
  const wireReady = new Map(); // tracks whether a wire has been driven

  for (const pin of chipDef.inputs) {
    if (!(pin.name in inputs)) {
      throw new SimError(
        `Missing input '${pin.name}' for chip '${chipDef.name}'`,
        { kind: 'missing-input' }
      );
    }
    wires.set(pin.name, inputs[pin.name]);
    wireReady.set(pin.name, true);
  }

  // Initialize all other wires to 0 (bits will be OR-ed in)
  for (const part of chipDef.parts) {
    for (const conn of part.connections) {
      if (conn.isConstant) continue;
      if (!wires.has(conn.wire)) {
        wires.set(conn.wire, 0);
        wireReady.set(conn.wire, false);
      }
    }
  }

  // Check for multiple drivers at the bit level
  const drivenBits = new Map();
  for (const part of chipDef.parts) {
    const subChip = registry.get(part.chipName);
    const subOutputMap = new Map(subChip.outputs.map((p) => [p.name, p]));
    for (const conn of part.connections) {
      const subOut = subOutputMap.get(conn.subPin);
      if (!subOut) continue; // input connection

      const bits = getTargetBits(conn, subOut);
      if (!drivenBits.has(conn.wire)) {
        drivenBits.set(conn.wire, new Map());
      }
      const existing = drivenBits.get(conn.wire);
      for (const bit of bits) {
        if (existing.has(bit)) {
          throw new SimError(
            `Bit ${bit} of wire '${conn.wire}' is driven by multiple parts`,
            { line: part.line ?? null, col: part.col ?? null, kind: 'multi-driver' }
          );
        }
        existing.set(bit, part);
      }
    }
  }

  // Iterative resolution
  const simulated = new Array(chipDef.parts.length).fill(false);
  const maxPasses = chipDef.parts.length + 1;

  for (let pass = 0; pass < maxPasses; pass++) {
    let progress = false;

    for (let i = 0; i < chipDef.parts.length; i++) {
      if (simulated[i]) continue;

      const part = chipDef.parts[i];
      const subChip = registry.get(part.chipName);
      const subInputMap = new Map(subChip.inputs.map((p) => [p.name, p]));
      const subOutputMap = new Map(subChip.outputs.map((p) => [p.name, p]));

      // Gather input values for this part
      const subInputs = {};
      let ready = true;

      for (const conn of part.connections) {
        if (!subInputMap.has(conn.subPin)) continue; // output connection

        const val = readWireValue(conn, wires, wireReady, subInputMap.get(conn.subPin));
        if (val === undefined) {
          ready = false;
          break;
        }

        // Accumulate into sub-pin (handles partial-bit assembly)
        if (conn.subBus === null) {
          subInputs[conn.subPin] = val;
        } else if ('index' in conn.subBus) {
          subInputs[conn.subPin] = (subInputs[conn.subPin] || 0) | ((val & 1) << conn.subBus.index);
        } else {
          subInputs[conn.subPin] = (subInputs[conn.subPin] || 0) | (val << conn.subBus.start);
        }
      }

      if (!ready) continue;

      // Simulate the sub-chip
      let subOutputs;
      try {
        subOutputs = simulate(subChip, subInputs, registry);
      } catch (err) {
        if (err instanceof SimError && err.kind === 'missing-input' && err.line === null) {
          err.line = part.line ?? null;
          err.col = part.col ?? null;
        }
        throw err;
      }

      // Write outputs to wires
      for (const conn of part.connections) {
        if (!subOutputMap.has(conn.subPin)) continue; // input connection

        let value = subOutputs[conn.subPin];

        // Extract bits if sub-pin side has bus notation
        if (conn.subBus !== null) {
          if ('index' in conn.subBus) {
            value = (value >> conn.subBus.index) & 1;
          } else {
            const width = conn.subBus.end - conn.subBus.start + 1;
            value = (value >> conn.subBus.start) & ((1 << width) - 1);
          }
        }

        // Write to wire
        if (conn.isConstant) continue; // constants aren't wires

        if (conn.wireBus === null) {
          wires.set(conn.wire, value);
        } else if ('index' in conn.wireBus) {
          const current = wires.get(conn.wire) || 0;
          wires.set(conn.wire, current | ((value & 1) << conn.wireBus.index));
        } else {
          const current = wires.get(conn.wire) || 0;
          wires.set(conn.wire, current | (value << conn.wireBus.start));
        }
        wireReady.set(conn.wire, true);
      }

      simulated[i] = true;
      progress = true;
    }

    if (simulated.every(Boolean)) break;
    if (!progress) {
      const stuckParts = chipDef.parts.filter((_, i) => !simulated[i]);
      const stuck = stuckParts.map((p) => p.chipName);
      const unresolvedWires = [...wireReady.entries()]
        .filter(([, v]) => !v)
        .map(([k]) => k);
      const firstStuck = stuckParts[0];
      throw new SimError(
        `Could not resolve all parts in chip '${chipDef.name}'. ` +
        `Stuck parts: ${stuck.join(', ')}. ` +
        `Unresolved wires: ${unresolvedWires.join(', ')}`,
        {
          line: firstStuck?.line ?? null,
          col: firstStuck?.col ?? null,
          kind: 'unresolved',
        }
      );
    }
  }

  // Collect outputs
  const result = {};
  for (const pin of chipDef.outputs) {
    const val = wires.get(pin.name);
    if (val === undefined) {
      throw new SimError(
        `Output '${pin.name}' was never assigned in chip '${chipDef.name}'`,
        { kind: 'output-unassigned' }
      );
    }
    result[pin.name] = val;
  }
  return result;
}

function readWireValue(conn, wires, wireReady, subPin) {
  // Constants are always ready
  if (conn.isConstant) {
    let width;
    if (conn.subBus !== null) {
      if ('index' in conn.subBus) {
        width = 1;
      } else {
        width = conn.subBus.end - conn.subBus.start + 1;
      }
    } else {
      width = subPin.width;
    }
    return conn.wire === 'true' ? (1 << width) - 1 : 0;
  }

  // Check if wire is ready
  if (!wireReady.get(conn.wire)) return undefined;

  const fullValue = wires.get(conn.wire);

  if (conn.wireBus === null) {
    return fullValue;
  }

  if ('index' in conn.wireBus) {
    return (fullValue >> conn.wireBus.index) & 1;
  }

  // Range
  const { start, end } = conn.wireBus;
  const width = end - start + 1;
  return (fullValue >> start) & ((1 << width) - 1);
}

function getTargetBits(conn, subOutPin) {
  if (conn.isConstant) return [];

  if (conn.wireBus === null) {
    // Whole wire — determine width from sub-pin output
    let width;
    if (conn.subBus !== null) {
      width = 'index' in conn.subBus ? 1 : conn.subBus.end - conn.subBus.start + 1;
    } else {
      width = subOutPin.width;
    }
    return Array.from({ length: width }, (_, i) => i);
  }

  if ('index' in conn.wireBus) {
    return [conn.wireBus.index];
  }

  // Range
  const { start, end } = conn.wireBus;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
