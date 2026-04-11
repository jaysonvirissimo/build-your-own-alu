export function simulate(chipDef, inputs, registry) {
  // Built-in chips have an evaluate function
  if (chipDef.builtin) {
    return chipDef.evaluate(inputs);
  }

  // Build wire map: input wires initialized from inputs, everything else undefined
  const wires = new Map();
  for (const pin of chipDef.inputs) {
    if (!(pin.name in inputs)) {
      throw new Error(`Missing input '${pin.name}' for chip '${chipDef.name}'`);
    }
    wires.set(pin.name, inputs[pin.name]);
  }

  // Identify output wire names
  const outputNames = new Set(chipDef.outputs.map((p) => p.name));

  // Identify all internal wire names (written by parts but not an input or output)
  // and output wire names — all start as undefined
  for (const part of chipDef.parts) {
    for (const conn of part.connections) {
      if (!wires.has(conn.wire)) {
        wires.set(conn.wire, undefined);
      }
    }
  }

  // Validate all parts reference known chips
  for (const part of chipDef.parts) {
    if (!registry.has(part.chipName)) {
      const available = registry.getAvailableNames().join(', ');
      throw new Error(
        `Chip '${part.chipName}' is not available. Available chips: ${available}`
      );
    }
  }

  // Check for multiple drivers on the same wire
  const drivers = new Map();
  for (const part of chipDef.parts) {
    const subChip = registry.get(part.chipName);
    const subOutputNames = new Set(subChip.outputs.map((p) => p.name));
    for (const conn of part.connections) {
      if (subOutputNames.has(conn.subPin)) {
        if (drivers.has(conn.wire)) {
          throw new Error(
            `Wire '${conn.wire}' is driven by multiple parts`
          );
        }
        drivers.set(conn.wire, part);
      }
    }
  }

  // Iterative resolution: simulate parts whose inputs are all defined
  const simulated = new Array(chipDef.parts.length).fill(false);
  const maxPasses = chipDef.parts.length + 1;

  for (let pass = 0; pass < maxPasses; pass++) {
    let progress = false;

    for (let i = 0; i < chipDef.parts.length; i++) {
      if (simulated[i]) continue;

      const part = chipDef.parts[i];
      const subChip = registry.get(part.chipName);
      const subInputNames = new Set(subChip.inputs.map((p) => p.name));

      // Gather input values for this part
      const subInputs = {};
      let ready = true;
      for (const conn of part.connections) {
        if (subInputNames.has(conn.subPin)) {
          const val = wires.get(conn.wire);
          if (val === undefined) {
            ready = false;
            break;
          }
          subInputs[conn.subPin] = val;
        }
      }

      if (!ready) continue;

      // Simulate the sub-chip
      const subOutputs = simulate(subChip, subInputs, registry);

      // Write outputs to wires
      const subOutputNameSet = new Set(subChip.outputs.map((p) => p.name));
      for (const conn of part.connections) {
        if (subOutputNameSet.has(conn.subPin)) {
          wires.set(conn.wire, subOutputs[conn.subPin]);
        }
      }

      simulated[i] = true;
      progress = true;
    }

    if (simulated.every(Boolean)) break;
    if (!progress) {
      const stuck = chipDef.parts
        .filter((_, i) => !simulated[i])
        .map((p) => p.chipName);
      const unresolvedWires = [...wires.entries()]
        .filter(([, v]) => v === undefined)
        .map(([k]) => k);
      throw new Error(
        `Could not resolve all parts in chip '${chipDef.name}'. ` +
        `Stuck parts: ${stuck.join(', ')}. ` +
        `Unresolved wires: ${unresolvedWires.join(', ')}`
      );
    }
  }

  // Collect outputs
  const result = {};
  for (const pin of chipDef.outputs) {
    const val = wires.get(pin.name);
    if (val === undefined) {
      throw new Error(
        `Output '${pin.name}' was never assigned in chip '${chipDef.name}'`
      );
    }
    result[pin.name] = val;
  }
  return result;
}
