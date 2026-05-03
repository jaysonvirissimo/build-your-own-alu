import { describe, it, expect } from 'vitest';
import { chipDefToNetlist } from '../netlist-converter.js';
import { ChipRegistry } from '../../hdl/chips.js';
import { parseHDL } from '../../hdl/parser.js';

function setupRegistry() {
  const registry = new ChipRegistry();
  registry.register('Not', parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }'));
  registry.register('And', parseHDL('CHIP And { IN a, b; OUT out; PARTS: Nand(a=a, b=b, out=n); Not(in=n, out=out); }'));
  registry.register('Or', parseHDL('CHIP Or { IN a, b; OUT out; PARTS: Not(in=a, out=na); Not(in=b, out=nb); Nand(a=na, b=nb, out=out); }'));
  return registry;
}

describe('chipDefToNetlist', () => {
  it('emits a single module keyed by chip name', () => {
    const registry = new ChipRegistry();
    const def = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    const netlist = chipDefToNetlist(def, registry);

    expect(Object.keys(netlist.modules)).toEqual(['Not']);
    const mod = netlist.modules.Not;
    expect(mod.ports.in.direction).toBe('input');
    expect(mod.ports.out.direction).toBe('output');
    expect(mod.ports.in.bits).toHaveLength(1);
  });

  it('maps Nand to $_NAND_ with A/B/Y pin renaming', () => {
    const registry = new ChipRegistry();
    const def = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    const netlist = chipDefToNetlist(def, registry);

    const cell = netlist.modules.Not.cells['Nand$0'];
    expect(cell.type).toBe('$_NAND_');
    expect(cell.port_directions).toEqual({ A: 'input', B: 'input', Y: 'output' });
    expect(cell.connections.A).toEqual(cell.connections.B); // both wired to `in`
    expect(cell.connections.Y).toEqual(netlist.modules.Not.ports.out.bits);
  });

  it('keeps user-defined chip names as cell type', () => {
    const registry = setupRegistry();
    // HalfAdder uses And + Xor — both are user-defined here, with Xor unknown
    const def = parseHDL(
      'CHIP HalfAdder { IN a, b; OUT sum, carry; PARTS: And(a=a, b=b, out=carry); }'
    );
    const netlist = chipDefToNetlist(def, registry);
    const cell = netlist.modules.HalfAdder.cells['And$0'];
    expect(cell.type).toBe('$_AND_');
  });

  it('shares bit IDs between connected cells', () => {
    const registry = setupRegistry();
    const def = parseHDL(
      'CHIP X { IN a, b; OUT out; PARTS: And(a=a, b=b, out=w); Not(in=w, out=out); }'
    );
    const netlist = chipDefToNetlist(def, registry);

    const andOut = netlist.modules.X.cells['And$0'].connections.Y;
    const notIn = netlist.modules.X.cells['Not$1'].connections.A;
    expect(andOut).toEqual(notIn);
  });

  it('encodes constants as "0" and "1" strings', () => {
    const registry = setupRegistry();
    const def = parseHDL(
      'CHIP X { IN a; OUT out; PARTS: And(a=a, b=true, out=out); }'
    );
    const netlist = chipDefToNetlist(def, registry);
    const cell = netlist.modules.X.cells['And$0'];
    expect(cell.connections.B).toEqual(['1']);
  });

  it('allocates one bit per width unit for buses', () => {
    const registry = new ChipRegistry();
    registry.register('Not', parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }'));
    // Reuse a built-in-shaped chip by inferring widths from output writes.
    const def = parseHDL(
      'CHIP Buf16 { IN in[16]; OUT out[16]; PARTS: Not(in=in[0], out=out[0]); }'
    );
    const netlist = chipDefToNetlist(def, registry);

    expect(netlist.modules.Buf16.ports.in.bits).toHaveLength(16);
    expect(netlist.modules.Buf16.ports.out.bits).toHaveLength(16);

    // The Not cell connects only bit 0 of in → bit 0 of out.
    const cell = netlist.modules.Buf16.cells['Not$0'];
    expect(cell.connections.A).toEqual([netlist.modules.Buf16.ports.in.bits[0]]);
    expect(cell.connections.Y).toEqual([netlist.modules.Buf16.ports.out.bits[0]]);
  });

  it('records every wire in netnames', () => {
    const registry = setupRegistry();
    const def = parseHDL(
      'CHIP X { IN a, b; OUT out; PARTS: And(a=a, b=b, out=w); Not(in=w, out=out); }'
    );
    const netlist = chipDefToNetlist(def, registry);
    expect(Object.keys(netlist.modules.X.netnames).sort()).toEqual(['a', 'b', 'out', 'w']);
  });
});
