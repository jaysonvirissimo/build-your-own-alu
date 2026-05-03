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

  it('maps registered user-defined chips to their primitive type', () => {
    // And is registered as a user-defined chip but maps to $_AND_ via
    // PRIMITIVE_MAP so it renders with a conventional AND symbol.
    const registry = setupRegistry();
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

  it('places sub-bus-sliced output bits at the correct sub-pin indices', () => {
    // A user-defined chip with a wide output. Foo(out[3..5]=w) should leave
    // bits 0-2 and 6-15 of out empty ('x') and place bits 3-5 from w.
    const registry = new ChipRegistry();
    registry.register('Foo', parseHDL(
      'CHIP Foo { IN in; OUT out[16]; PARTS: Nand(a=in, b=in, out=out[0]); }'
    ));
    const def = parseHDL(
      'CHIP X { IN in; OUT w[3]; PARTS: Foo(in=in, out[3..5]=w); }'
    );
    const netlist = chipDefToNetlist(def, registry);
    const fooOut = netlist.modules.X.cells['Foo$0'].connections.out;
    expect(fooOut).toHaveLength(16);
    expect(fooOut[0]).toBe('x');
    expect(fooOut[2]).toBe('x');
    expect(fooOut[6]).toBe('x');
    // Bits 3,4,5 should hold the bit IDs of wire `w`
    const wBits = netlist.modules.X.netnames.w.bits;
    expect(fooOut.slice(3, 6)).toEqual(wBits);
  });

  it('marks undriven multi-bit pin slots as Yosys "x"', () => {
    // Driving only b[0] of a 16-bit input pin leaves the other 15 bits
    // undriven. They should be 'x' (unknown), not '0' (low).
    const registry = new ChipRegistry();
    registry.register('Wide', parseHDL(
      'CHIP Wide { IN b[16]; OUT out; PARTS: Nand(a=b[0], b=b[0], out=out); }'
    ));
    const def = parseHDL(
      'CHIP X { IN a; OUT out; PARTS: Wide(b[0]=true, out=out); }'
    );
    const netlist = chipDefToNetlist(def, registry);
    const cell = netlist.modules.X.cells['Wide$0'];
    expect(cell.connections.b).toHaveLength(16);
    expect(cell.connections.b[0]).toBe('1');
    for (let i = 1; i < 16; i++) {
      expect(cell.connections.b[i]).toBe('x');
    }
  });

  it('infers wire width from sliced reads when no driver exists', () => {
    // The wire `in` is only ever read (Foo's input). Without bidirectional
    // inference, its width would default to 1 and bit 5 would be undefined.
    const registry = new ChipRegistry();
    registry.register('Foo', parseHDL(
      'CHIP Foo { IN x; OUT out; PARTS: Nand(a=x, b=x, out=out); }'
    ));
    const def = parseHDL(
      'CHIP X { IN in[8]; OUT out; PARTS: Foo(x=in[5], out=out); }'
    );
    const netlist = chipDefToNetlist(def, registry);
    expect(netlist.modules.X.ports.in.bits).toHaveLength(8);
    const cell = netlist.modules.X.cells['Foo$0'];
    // Foo is user-defined, so its pin name `x` is preserved (no primitive rename).
    expect(cell.connections.x).toEqual([netlist.modules.X.ports.in.bits[5]]);
  });

  it('collapses chips with more than the threshold parts into a black box', () => {
    // Build a chip with 11 trivial parts. It should render as one cell
    // labeled with the chip name, with ports mirroring the chip.
    const registry = new ChipRegistry();
    registry.register('Not', parseHDL(
      'CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }'
    ));
    const partsList = Array.from({ length: 11 }, (_, i) =>
      `Not(in=in, out=t${i});`
    ).join(' ');
    const def = parseHDL(
      `CHIP Big { IN in; OUT out; PARTS: ${partsList} Nand(a=in, b=in, out=out); }`
    );
    const netlist = chipDefToNetlist(def, registry);
    const cells = netlist.modules.Big.cells;
    expect(Object.keys(cells)).toEqual(['Big$0']);
    const cell = cells['Big$0'];
    expect(cell.type).toBe('Big');
    expect(cell.port_directions).toEqual({ in: 'input', out: 'output' });
    expect(cell.connections.in).toEqual(netlist.modules.Big.ports.in.bits);
    expect(cell.connections.out).toEqual(netlist.modules.Big.ports.out.bits);
  });
});
