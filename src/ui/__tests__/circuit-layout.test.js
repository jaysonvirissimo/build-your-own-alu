import { describe, it, expect } from 'vitest';
import { computeLayout } from '../circuit-layout.js';
import { ChipRegistry } from '../../hdl/chips.js';
import { parseHDL } from '../../hdl/parser.js';

function setupRegistry() {
  const registry = new ChipRegistry();
  const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
  registry.register('Not', notDef);
  const andDef = parseHDL('CHIP And { IN a, b; OUT out; PARTS: Nand(a=a, b=b, out=n); Not(in=n, out=out); }');
  registry.register('And', andDef);
  const orDef = parseHDL('CHIP Or { IN a, b; OUT out; PARTS: Not(in=a, out=na); Not(in=b, out=nb); Nand(a=na, b=nb, out=out); }');
  registry.register('Or', orDef);
  return registry;
}

describe('computeLayout', () => {
  it('lays out Not (1 Nand gate)', () => {
    const registry = new ChipRegistry();
    const def = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    const layout = computeLayout(def, registry);

    const inputs = layout.nodes.filter((n) => n.type === 'input');
    const gates = layout.nodes.filter((n) => n.type === 'gate');
    const outputs = layout.nodes.filter((n) => n.type === 'output');

    expect(inputs).toHaveLength(1);
    expect(inputs[0].label).toBe('in');
    expect(gates).toHaveLength(1);
    expect(gates[0].label).toBe('Nand');
    expect(outputs).toHaveLength(1);
    expect(outputs[0].label).toBe('out');

    // Gate should be to the right of input, output to the right of gate
    expect(gates[0].x).toBeGreaterThan(inputs[0].x);
    expect(outputs[0].x).toBeGreaterThan(gates[0].x);

    // Nand(a=in, b=in, out=out) should produce 3 edges:
    // in->Nand pin a, in->Nand pin b, Nand->out
    expect(layout.edges).toHaveLength(3);
    const inputEdges = layout.edges.filter((e) => e.from === 'input:in');
    expect(inputEdges).toHaveLength(2);
    expect(inputEdges.map((e) => e.toPin).sort()).toEqual(['a', 'b']);

    expect(gates[0].inputPins).toEqual(['a', 'b']);
    expect(gates[0].outputPins).toEqual(['out']);

    expect(layout.viewBox.width).toBeGreaterThan(0);
    expect(layout.viewBox.height).toBeGreaterThan(0);
  });

  it('lays out And (Nand + Not, 2 columns)', () => {
    const registry = setupRegistry();
    const def = parseHDL(`
      CHIP And {
        IN a, b;
        OUT out;
        PARTS:
        Nand(a=a, b=b, out=nandOut);
        Not(in=nandOut, out=out);
      }
    `);
    const layout = computeLayout(def, registry);

    const gates = layout.nodes.filter((n) => n.type === 'gate');
    expect(gates).toHaveLength(2);

    const nandNode = gates.find((n) => n.label === 'Nand');
    const notNode = gates.find((n) => n.label === 'Not');
    // Not depends on Nand's output, so it should be in a later column
    expect(notNode.x).toBeGreaterThan(nandNode.x);

    expect(layout.nodes.filter((n) => n.type === 'input')).toHaveLength(2);
    expect(layout.nodes.filter((n) => n.type === 'output')).toHaveLength(1);
  });

  it('lays out Or with fan-out (2 Nots + 1 Nand)', () => {
    const registry = setupRegistry();
    const def = parseHDL(`
      CHIP Or {
        IN a, b;
        OUT out;
        PARTS:
        Not(in=a, out=notA);
        Not(in=b, out=notB);
        Nand(a=notA, b=notB, out=out);
      }
    `);
    const layout = computeLayout(def, registry);

    const gates = layout.nodes.filter((n) => n.type === 'gate');
    expect(gates).toHaveLength(3);

    // The two Not gates should be in column 0, Nand in column 1
    const nots = gates.filter((n) => n.label === 'Not');
    const nand = gates.find((n) => n.label === 'Nand');
    expect(nots).toHaveLength(2);
    expect(nand.x).toBeGreaterThan(nots[0].x);
    expect(nand.x).toBeGreaterThan(nots[1].x);
  });

  it('collapses when parts exceed threshold', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    registry.register('Not', notDef);

    const parts = Array.from({ length: 16 }, (_, i) =>
      `Not(in=in[${i}], out=out[${i}]);`
    ).join('\n');
    const def = parseHDL(`
      CHIP Not16 {
        IN in[16];
        OUT out[16];
        PARTS:
        ${parts}
      }
    `);
    const layout = computeLayout(def, registry);

    const gates = layout.nodes.filter((n) => n.type === 'gate');
    expect(gates).toHaveLength(1);
    expect(gates[0].label).toBe('Not16');

    expect(layout.nodes.filter((n) => n.type === 'input')).toHaveLength(1);
    expect(layout.nodes.filter((n) => n.type === 'output')).toHaveLength(1);
  });

  it('populates per-pin metadata on collapsed chips with multiple outputs', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    registry.register('Not', notDef);

    const parts = Array.from({ length: 11 }, (_, i) =>
      `Not(in=in[${i}], out=w${i});`
    ).join('\n');
    const def = parseHDL(`
      CHIP Multi {
        IN in[16];
        OUT a, b, c;
        PARTS:
        ${parts}
        Not(in=w0, out=a);
        Not(in=w1, out=b);
        Not(in=w2, out=c);
      }
    `);
    const layout = computeLayout(def, registry);

    const gates = layout.nodes.filter((n) => n.type === 'gate');
    expect(gates).toHaveLength(1);
    expect(gates[0].inputPins).toEqual(['in']);
    expect(gates[0].outputPins).toEqual(['a', 'b', 'c']);

    const outputEdges = layout.edges.filter((e) => e.from === 'gate:0');
    expect(outputEdges.map((e) => e.fromPin).sort()).toEqual(['a', 'b', 'c']);

    const inputEdges = layout.edges.filter((e) => e.to === 'gate:0');
    expect(inputEdges.map((e) => e.toPin)).toEqual(['in']);
  });

  it('records constants on gate nodes', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Foo {
        IN in;
        OUT out;
        PARTS:
        Nand(a=in, b=true, out=out);
      }
    `);
    const layout = computeLayout(def, registry);

    const gate = layout.nodes.find((n) => n.type === 'gate');
    expect(gate.constants).toEqual([{ pin: 'b', value: 'true' }]);

    // No edge for the constant connection
    const constEdges = layout.edges.filter((e) => e.label === 'true');
    expect(constEdges).toHaveLength(0);
  });

  it('handles parts in reverse dependency order', () => {
    const registry = setupRegistry();
    const def = parseHDL(`
      CHIP And {
        IN a, b;
        OUT out;
        PARTS:
        Not(in=nandOut, out=out);
        Nand(a=a, b=b, out=nandOut);
      }
    `);
    const layout = computeLayout(def, registry);

    const gates = layout.nodes.filter((n) => n.type === 'gate');
    const nandNode = gates.find((n) => n.label === 'Nand');
    const notNode = gates.find((n) => n.label === 'Not');
    // Not should still be after Nand despite being listed first
    expect(notNode.x).toBeGreaterThan(nandNode.x);
  });

  it('does not hang on self-referencing wires', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Bad {
        IN in;
        OUT out;
        PARTS:
        Nand(a=out, b=in, out=out);
      }
    `);
    // Should return a layout without hanging
    const layout = computeLayout(def, registry);
    expect(layout.nodes.filter((n) => n.type === 'gate')).toHaveLength(1);
  });
});
