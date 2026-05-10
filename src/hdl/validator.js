import { ValidationError } from './errors.js';

/** @typedef {import('./types.js').ChipDef} ChipDef */
/** @typedef {import('./types.js').Part} Part */
/** @typedef {import('./types.js').Connection} Connection */
/** @typedef {import('./chips.js').ChipRegistry} ChipRegistry */

/**
 * Run semantic checks on a parsed chip before simulation. Throws on the first
 * problem so the learner sees one clear error at a time. Pure: does not
 * mutate inputs, does not invoke the simulator.
 *
 * @param {ChipDef} chipDef
 * @param {ChipRegistry} registry
 * @throws {ValidationError}
 */
export function validateChip(chipDef, registry) {
  checkPinUniqueness(chipDef);
  checkPinWidths(chipDef);

  if (!chipDef.parts) return;

  // Map of this chip's own external pin widths — used for wire-side bus checks.
  const externalWireWidths = new Map();
  for (const pin of chipDef.inputs) externalWireWidths.set(pin.name, pin.width);
  for (const pin of chipDef.outputs) externalWireWidths.set(pin.name, pin.width);

  for (const part of chipDef.parts) {
    // Unknown chip names are reported by the simulator (chip-missing SimError).
    if (!registry.has(part.chipName)) continue;
    const subChip = registry.get(part.chipName);
    const subInputs = new Map(subChip.inputs.map((p) => [p.name, p]));
    const subOutputs = new Map(subChip.outputs.map((p) => [p.name, p]));

    checkUnknownSubPins(part, subInputs, subOutputs);
    checkBusBoundsAndOrder(part, subInputs, subOutputs, externalWireWidths);
    checkDuplicateInputConnections(part, subInputs);
    checkMissingSubInputs(part, subChip);
  }
}

function checkPinUniqueness(chipDef) {
  const seen = new Map();
  const consider = (pin, where) => {
    const prior = seen.get(pin.name);
    if (prior) {
      const location = prior === where ? `twice in ${where}` : `in both ${prior} and ${where}`;
      throw new ValidationError(
        `Pin '${pin.name}' is declared ${location}.`,
        { kind: 'duplicate-pin' }
      );
    }
    seen.set(pin.name, where);
  };
  for (const p of chipDef.inputs) consider(p, 'IN');
  for (const p of chipDef.outputs) consider(p, 'OUT');
}

function checkPinWidths(chipDef) {
  const check = (pin, where) => {
    if (!Number.isFinite(pin.width) || pin.width < 1) {
      throw new ValidationError(
        `Pin '${pin.name}' in ${where} has width ${pin.width}. Bus widths must be at least 1 bit; bus ranges go low-to-high.`,
        { kind: 'bad-pin-width' }
      );
    }
  };
  for (const p of chipDef.inputs) check(p, 'IN');
  for (const p of chipDef.outputs) check(p, 'OUT');
}

function checkUnknownSubPins(part, subInputs, subOutputs) {
  for (const conn of part.connections) {
    if (!subInputs.has(conn.subPin) && !subOutputs.has(conn.subPin)) {
      throw new ValidationError(
        `Chip '${part.chipName}' has no pin named '${conn.subPin}'.`,
        { line: part.line ?? null, col: part.col ?? null, kind: 'unknown-sub-pin' }
      );
    }
  }
}

function checkBusBoundsAndOrder(part, subInputs, subOutputs, externalWireWidths) {
  for (const conn of part.connections) {
    const subPin = subInputs.get(conn.subPin) ?? subOutputs.get(conn.subPin);
    if (!subPin) continue; // already reported by checkUnknownSubPins

    if (conn.subBus) {
      checkBusRef(conn.subBus, subPin.width, `pin '${conn.subPin}' on chip '${part.chipName}'`, part);
    }

    if (conn.wireBus && !conn.isConstant) {
      const wireWidth = externalWireWidths.get(conn.wire);
      // Wire-side bounds only checkable when the wire is one of the user
      // chip's external pins (width is declared). Internal-wire widths are
      // inferred at simulation time and out of scope here.
      checkBusRef(conn.wireBus, wireWidth ?? Infinity, `wire '${conn.wire}'`, part);
    }
  }
}

function checkBusRef(busRef, width, label, part) {
  if ('start' in busRef) {
    if (busRef.start > busRef.end) {
      throw new ValidationError(
        `Bus range [${busRef.start}..${busRef.end}] on ${label} is reversed. Ranges go low-to-high.`,
        { line: part.line ?? null, col: part.col ?? null, kind: 'reversed-bus-range' }
      );
    }
    if (busRef.end >= width) {
      throw new ValidationError(
        `Bit ${busRef.end} on ${label} is out of bounds. Valid indices are 0 through ${width - 1}.`,
        { line: part.line ?? null, col: part.col ?? null, kind: 'out-of-bounds-bus' }
      );
    }
    return;
  }
  if (busRef.index >= width) {
    throw new ValidationError(
      `Bit ${busRef.index} on ${label} is out of bounds. Valid indices are 0 through ${width - 1}.`,
      { line: part.line ?? null, col: part.col ?? null, kind: 'out-of-bounds-bus' }
    );
  }
}

function checkDuplicateInputConnections(part, subInputs) {
  /** @type {Map<string, number[]>} pinName → bits already written */
  const writtenBits = new Map();
  for (const conn of part.connections) {
    if (!subInputs.has(conn.subPin)) continue; // outputs read; only inputs are "written"
    const subPin = subInputs.get(conn.subPin);
    const bits = bitsCovered(conn.subBus, subPin.width);
    const prior = writtenBits.get(conn.subPin) ?? [];
    for (const b of bits) {
      if (prior.includes(b)) {
        throw new ValidationError(
          `Sub-pin '${conn.subPin}' on chip '${part.chipName}' is wired more than once (bit ${b}).`,
          { line: part.line ?? null, col: part.col ?? null, kind: 'duplicate-sub-connection' }
        );
      }
      prior.push(b);
    }
    writtenBits.set(conn.subPin, prior);
  }
}

function checkMissingSubInputs(part, subChip) {
  /** @type {Map<string, Set<number>>} */
  const coverage = new Map();
  for (const conn of part.connections) {
    if (!subChip.inputs.some((p) => p.name === conn.subPin)) continue;
    const subPin = subChip.inputs.find((p) => p.name === conn.subPin);
    const set = coverage.get(conn.subPin) ?? new Set();
    for (const b of bitsCovered(conn.subBus, subPin.width)) set.add(b);
    coverage.set(conn.subPin, set);
  }
  for (const inputPin of subChip.inputs) {
    const covered = coverage.get(inputPin.name);
    if (!covered || covered.size === 0) {
      throw new ValidationError(
        `Input '${inputPin.name}' on chip '${part.chipName}' is not connected.`,
        { line: part.line ?? null, col: part.col ?? null, kind: 'missing-sub-input' }
      );
    }
  }
}

function bitsCovered(busRef, pinWidth) {
  if (!busRef) {
    const out = [];
    for (let i = 0; i < pinWidth; i++) out.push(i);
    return out;
  }
  if ('start' in busRef) {
    const out = [];
    for (let i = busRef.start; i <= busRef.end; i++) out.push(i);
    return out;
  }
  return [busRef.index];
}
