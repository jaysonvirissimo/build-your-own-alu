import { SimError } from './errors.js';

/** @typedef {import('./types.js').ChipDef} ChipDef */
/** @typedef {import('./types.js').Connection} Connection */
/** @typedef {import('./types.js').Pin} Pin */
/** @typedef {import('./types.js').SimInputs} SimInputs */
/** @typedef {import('./types.js').SimOutputs} SimOutputs */
/** @typedef {import('./chips.js').ChipRegistry} ChipRegistry */

/**
 * Evaluate a chip against a single set of input values.
 * @param {ChipDef} chipDef
 * @param {SimInputs} inputs
 * @param {ChipRegistry} registry
 * @returns {SimOutputs}
 * @throws {SimError}
 */
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

  // Infer internal wire widths from connections.
  // Output writes set a lower bound on the wire's width; input reads with
  // explicit bus indices also imply a minimum width (wire must contain the
  // bit being read). Both are needed so diagnostics can name unresolved bits.
  const bumpWidth = (name, width) => {
    const existing = wireWidths.get(name);
    if (existing === undefined || width > existing) {
      wireWidths.set(name, width);
    }
  };
  for (const part of chipDef.parts) {
    const subChip = registry.get(part.chipName);
    const subOutputMap = new Map(subChip.outputs.map((p) => [p.name, p]));
    const subInputMap = new Map(subChip.inputs.map((p) => [p.name, p]));
    for (const conn of part.connections) {
      if (conn.isConstant) continue;

      const subOut = subOutputMap.get(conn.subPin);
      if (subOut) {
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

      const subIn = subInputMap.get(conn.subPin);
      if (subIn && conn.wireBus !== null) {
        const width = 'index' in conn.wireBus ? conn.wireBus.index + 1 : conn.wireBus.end + 1;
        bumpWidth(conn.wire, width);
      }
    }
  }

  // Build wire map: input wires from inputs, everything else starts at 0.
  // wireReadyBits tracks which bit indices of each wire have been driven.
  const wires = new Map();
  const wireReadyBits = new Map();

  for (const pin of chipDef.inputs) {
    if (!(pin.name in inputs)) {
      throw new SimError(
        `Missing input '${pin.name}' for chip '${chipDef.name}'`,
        { kind: 'missing-input' }
      );
    }
    wires.set(pin.name, inputs[pin.name]);
    const ready = new Set();
    for (let b = 0; b < pin.width; b++) ready.add(b);
    wireReadyBits.set(pin.name, ready);
  }

  // Initialize all other wires to 0 (bits will be OR-ed in)
  for (const part of chipDef.parts) {
    for (const conn of part.connections) {
      if (conn.isConstant) continue;
      if (!wires.has(conn.wire)) {
        wires.set(conn.wire, 0);
        wireReadyBits.set(conn.wire, new Set());
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

        const val = readWireValue(conn, wires, wireReadyBits, subInputMap.get(conn.subPin));
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
        const subOut = subOutputMap.get(conn.subPin);
        if (!subOut) continue; // input connection

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

        // Mark only the bits this connection actually wrote as ready.
        const writtenBits = getTargetBits(conn, subOut);
        const readySet = wireReadyBits.get(conn.wire);
        for (const b of writtenBits) readySet.add(b);
      }

      simulated[i] = true;
      progress = true;
    }

    if (simulated.every(Boolean)) break;
    if (!progress) {
      const stuckParts = chipDef.parts.filter((_, i) => !simulated[i]);
      const stuck = stuckParts.map((p) => p.chipName);
      const unresolvedWires = describeUnreadyWires(wireReadyBits, wireWidths);
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

  // Collect outputs — every declared output bit must have been driven
  const result = {};
  for (const pin of chipDef.outputs) {
    const readySet = wireReadyBits.get(pin.name);
    const missing = [];
    for (let b = 0; b < pin.width; b++) {
      if (!readySet || !readySet.has(b)) missing.push(b);
    }
    if (missing.length) {
      const detail = pin.width === 1
        ? ''
        : ` (bit${missing.length === 1 ? '' : 's'} ${formatBitList(missing)})`;
      throw new SimError(
        `Output '${pin.name}' was never assigned${detail} in chip '${chipDef.name}'`,
        { kind: 'output-unassigned' }
      );
    }
    result[pin.name] = wires.get(pin.name);
  }
  return result;
}

/**
 * Read a connection's wire-side value, returning `undefined` when any of the
 * requested bits are not yet ready.
 * @param {Connection} conn
 * @param {Map<string, number>} wires
 * @param {Map<string, Set<number>>} wireReadyBits
 * @param {Pin} subPin
 * @returns {number | undefined}
 */
function readWireValue(conn, wires, wireReadyBits, subPin) {
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

  // Every bit being read from the wire must be in the ready set
  const readBits = getReadBits(conn, subPin);
  const readySet = wireReadyBits.get(conn.wire);
  if (!readySet) return undefined;
  for (const bit of readBits) {
    if (!readySet.has(bit)) return undefined;
  }

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

/**
 * Wire-side bit indices written by a connection whose sub-pin is an output.
 * @param {Connection} conn
 * @param {Pin} subOutPin
 * @returns {number[]}
 */
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

/**
 * Mirror of getTargetBits for read connections. Returns the wire-side bit
 * indices that this connection sources from `conn.wire`.
 * @param {Connection} conn
 * @param {Pin} subPin
 * @returns {number[]}
 */
function getReadBits(conn, subPin) {
  if (conn.wireBus === null) {
    let width;
    if (conn.subBus !== null) {
      width = 'index' in conn.subBus ? 1 : conn.subBus.end - conn.subBus.start + 1;
    } else {
      width = subPin.width;
    }
    return Array.from({ length: width }, (_, i) => i);
  }
  if ('index' in conn.wireBus) {
    return [conn.wireBus.index];
  }
  const { start, end } = conn.wireBus;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function describeUnreadyWires(wireReadyBits, wireWidths) {
  const out = [];
  for (const [name, readySet] of wireReadyBits) {
    const width = wireWidths.get(name) ?? 1;
    if (readySet.size >= width) continue;
    if (width === 1) {
      out.push(name);
      continue;
    }
    const missing = [];
    for (let b = 0; b < width; b++) {
      if (!readySet.has(b)) missing.push(b);
    }
    out.push(`${name}[${formatBitList(missing)}]`);
  }
  return out;
}

function formatBitList(bits) {
  // Collapse contiguous runs into "a..b".
  const parts = [];
  let i = 0;
  while (i < bits.length) {
    let j = i;
    while (j + 1 < bits.length && bits[j + 1] === bits[j] + 1) j++;
    parts.push(i === j ? String(bits[i]) : `${bits[i]}..${bits[j]}`);
    i = j + 1;
  }
  return parts.join(',');
}
