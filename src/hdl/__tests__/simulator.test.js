import { describe, it, expect } from 'vitest';
import { simulate } from '../simulator.js';
import { ChipRegistry } from '../chips.js';
import { parseHDL } from '../parser.js';

describe('simulate', () => {
  // --- Single-bit tests (existing) ---

  it('simulates built-in Nand for all input combinations', () => {
    const registry = new ChipRegistry();
    const nand = registry.get('Nand');
    expect(simulate(nand, { a: 0, b: 0 }, registry)).toEqual({ out: 1 });
    expect(simulate(nand, { a: 0, b: 1 }, registry)).toEqual({ out: 1 });
    expect(simulate(nand, { a: 1, b: 0 }, registry)).toEqual({ out: 1 });
    expect(simulate(nand, { a: 1, b: 1 }, registry)).toEqual({ out: 0 });
  });

  it('simulates Not built from Nand', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL(`
      CHIP Not {
        IN in;
        OUT out;
        PARTS:
        Nand(a=in, b=in, out=out);
      }
    `);
    expect(simulate(notDef, { in: 0 }, registry)).toEqual({ out: 1 });
    expect(simulate(notDef, { in: 1 }, registry)).toEqual({ out: 0 });
  });

  it('simulates And using registered Not', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL(`
      CHIP Not {
        IN in;
        OUT out;
        PARTS:
        Nand(a=in, b=in, out=out);
      }
    `);
    registry.register('Not', notDef);

    const andDef = parseHDL(`
      CHIP And {
        IN a, b;
        OUT out;
        PARTS:
        Nand(a=a, b=b, out=nandOut);
        Not(in=nandOut, out=out);
      }
    `);
    expect(simulate(andDef, { a: 0, b: 0 }, registry)).toEqual({ out: 0 });
    expect(simulate(andDef, { a: 0, b: 1 }, registry)).toEqual({ out: 0 });
    expect(simulate(andDef, { a: 1, b: 0 }, registry)).toEqual({ out: 0 });
    expect(simulate(andDef, { a: 1, b: 1 }, registry)).toEqual({ out: 1 });
  });

  it('simulates Or using registered Not and Nand', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL(`
      CHIP Not {
        IN in;
        OUT out;
        PARTS:
        Nand(a=in, b=in, out=out);
      }
    `);
    registry.register('Not', notDef);

    const orDef = parseHDL(`
      CHIP Or {
        IN a, b;
        OUT out;
        PARTS:
        Not(in=a, out=notA);
        Not(in=b, out=notB);
        Nand(a=notA, b=notB, out=out);
      }
    `);
    expect(simulate(orDef, { a: 0, b: 0 }, registry)).toEqual({ out: 0 });
    expect(simulate(orDef, { a: 0, b: 1 }, registry)).toEqual({ out: 1 });
    expect(simulate(orDef, { a: 1, b: 0 }, registry)).toEqual({ out: 1 });
    expect(simulate(orDef, { a: 1, b: 1 }, registry)).toEqual({ out: 1 });
  });

  it('handles fan-out (one wire feeding multiple parts)', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL(`
      CHIP Not {
        IN in;
        OUT out;
        PARTS:
        Nand(a=in, b=in, out=out);
      }
    `);
    expect(simulate(notDef, { in: 0 }, registry)).toEqual({ out: 1 });
  });

  it('throws on unknown chip', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Foo {
        IN a;
        OUT out;
        PARTS:
        Or(a=a, b=a, out=out);
      }
    `);
    expect(() => simulate(def, { a: 0 }, registry)).toThrow(/Or.*not available/);
    expect(() => simulate(def, { a: 0 }, registry)).toThrow(/Nand/);
  });

  it('throws on circular dependency (self-referencing wire)', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Bad {
        IN in;
        OUT out;
        PARTS:
        Nand(a=out, b=in, out=out);
      }
    `);
    expect(() => simulate(def, { in: 0 }, registry)).toThrow(/Could not resolve/);
    expect(() => simulate(def, { in: 0 }, registry)).toThrow(/out/);
  });

  it('throws on unresolved wire (typo)', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Bad {
        IN a, b;
        OUT out;
        PARTS:
        Nand(a=a, b=b, out=nandOut);
        Nand(a=typo, b=typo, out=out);
      }
    `);
    expect(() => simulate(def, { a: 0, b: 0 }, registry)).toThrow(/Could not resolve/);
  });

  it('throws on multiple drivers for the same wire', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Bad {
        IN a, b;
        OUT out;
        PARTS:
        Nand(a=a, b=b, out=w);
        Nand(a=a, b=b, out=w);
        Nand(a=w, b=w, out=out);
      }
    `);
    expect(() => simulate(def, { a: 0, b: 0 }, registry)).toThrow(/multiple parts/);
  });

  it('throws on missing input', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Foo {
        IN a, b;
        OUT out;
        PARTS:
        Nand(a=a, b=b, out=out);
      }
    `);
    expect(() => simulate(def, { a: 0 }, registry)).toThrow(/Missing input 'b'/);
  });

  it('handles parts in any order (topological resolution)', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP And {
        IN a, b;
        OUT out;
        PARTS:
        Nand(a=nandOut, b=nandOut, out=out);
        Nand(a=a, b=b, out=nandOut);
      }
    `);
    expect(simulate(def, { a: 1, b: 1 }, registry)).toEqual({ out: 1 });
    expect(simulate(def, { a: 1, b: 0 }, registry)).toEqual({ out: 0 });
  });

  // --- Bus / multi-bit tests ---

  it('simulates a 16-bit pass-through chip', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Id16 {
        IN in[16];
        OUT out[16];
        PARTS:
        Not(in=in[0], out=n0);  Not(in=n0, out=out[0]);
        Not(in=in[1], out=n1);  Not(in=n1, out=out[1]);
        Not(in=in[2], out=n2);  Not(in=n2, out=out[2]);
        Not(in=in[3], out=n3);  Not(in=n3, out=out[3]);
        Not(in=in[4], out=n4);  Not(in=n4, out=out[4]);
        Not(in=in[5], out=n5);  Not(in=n5, out=out[5]);
        Not(in=in[6], out=n6);  Not(in=n6, out=out[6]);
        Not(in=in[7], out=n7);  Not(in=n7, out=out[7]);
        Not(in=in[8], out=n8);  Not(in=n8, out=out[8]);
        Not(in=in[9], out=n9);  Not(in=n9, out=out[9]);
        Not(in=in[10], out=n10); Not(in=n10, out=out[10]);
        Not(in=in[11], out=n11); Not(in=n11, out=out[11]);
        Not(in=in[12], out=n12); Not(in=n12, out=out[12]);
        Not(in=in[13], out=n13); Not(in=n13, out=out[13]);
        Not(in=in[14], out=n14); Not(in=n14, out=out[14]);
        Not(in=in[15], out=n15); Not(in=n15, out=out[15]);
      }
    `);
    const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    registry.register('Not', notDef);
    expect(simulate(def, { in: 0xABCD }, registry)).toEqual({ out: 0xABCD });
    expect(simulate(def, { in: 0 }, registry)).toEqual({ out: 0 });
    expect(simulate(def, { in: 0xFFFF }, registry)).toEqual({ out: 0xFFFF });
  });

  it('simulates Not16 from 16 Not gates with bit indexing', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    registry.register('Not', notDef);

    const not16src = `
      CHIP Not16 {
        IN in[16];
        OUT out[16];
        PARTS:
        ${Array.from({ length: 16 }, (_, i) =>
          `Not(in=in[${i}], out=out[${i}]);`
        ).join('\n        ')}
      }
    `;
    const not16Def = parseHDL(not16src);
    expect(simulate(not16Def, { in: 0x0000 }, registry)).toEqual({ out: 0xFFFF });
    expect(simulate(not16Def, { in: 0xFFFF }, registry)).toEqual({ out: 0x0000 });
    expect(simulate(not16Def, { in: 0xAAAA }, registry)).toEqual({ out: 0x5555 });
    expect(simulate(not16Def, { in: 0x00FF }, registry)).toEqual({ out: 0xFF00 });
  });

  it('handles constants: false = all zeros', () => {
    const registry = new ChipRegistry();
    // Chip that ANDs input with false (always 0)
    const def = parseHDL(`
      CHIP Zero {
        IN a;
        OUT out;
        PARTS:
        Nand(a=a, b=false, out=nandOut);
        Nand(a=nandOut, b=nandOut, out=out);
      }
    `);
    // AND(a, false) = 0 for any a
    expect(simulate(def, { a: 0 }, registry)).toEqual({ out: 0 });
    expect(simulate(def, { a: 1 }, registry)).toEqual({ out: 0 });
  });

  it('handles constants: true = all ones (width-dependent)', () => {
    const registry = new ChipRegistry();
    // Chip that NANDs input with true (equivalent to NOT)
    const def = parseHDL(`
      CHIP NotViaTrue {
        IN in;
        OUT out;
        PARTS:
        Nand(a=in, b=true, out=out);
      }
    `);
    expect(simulate(def, { in: 0 }, registry)).toEqual({ out: 1 });
    expect(simulate(def, { in: 1 }, registry)).toEqual({ out: 0 });
  });

  it('handles sub-pin indexing with constants', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    registry.register('Not', notDef);
    const andDef = parseHDL(`
      CHIP And {
        IN a, b;
        OUT out;
        PARTS:
        Nand(a=a, b=b, out=nandOut);
        Not(in=nandOut, out=out);
      }
    `);
    registry.register('And', andDef);

    // A chip with a 2-bit input where b[0]=true, b[1]=false → b=1
    const def = parseHDL(`
      CHIP TestSubPin {
        IN a[2];
        OUT out;
        PARTS:
        And(a=a[0], b=a[1], out=out);
      }
    `);
    expect(simulate(def, { a: 0b11 }, registry)).toEqual({ out: 1 }); // both bits 1
    expect(simulate(def, { a: 0b01 }, registry)).toEqual({ out: 0 }); // bit 0 is 1, bit 1 is 0
    expect(simulate(def, { a: 0b10 }, registry)).toEqual({ out: 0 }); // bit 0 is 0, bit 1 is 1
  });

  it('handles wire-side slicing', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    registry.register('Not', notDef);
    const orDef = parseHDL(`
      CHIP Or {
        IN a, b;
        OUT out;
        PARTS:
        Not(in=a, out=notA);
        Not(in=b, out=notB);
        Nand(a=notA, b=notB, out=out);
      }
    `);
    registry.register('Or', orDef);

    // Or8Way: OR all 8 bits together
    const or8Def = parseHDL(`
      CHIP Or8Way {
        IN in[8];
        OUT out;
        PARTS:
        Or(a=in[0], b=in[1], out=o01);
        Or(a=in[2], b=in[3], out=o23);
        Or(a=in[4], b=in[5], out=o45);
        Or(a=in[6], b=in[7], out=o67);
        Or(a=o01, b=o23, out=o0123);
        Or(a=o45, b=o67, out=o4567);
        Or(a=o0123, b=o4567, out=out);
      }
    `);
    registry.register('Or8Way', or8Def);

    // Now test slicing: extract bits 0..7 from a 16-bit input
    const def = parseHDL(`
      CHIP TestSlice {
        IN data[16];
        OUT out;
        PARTS:
        Or8Way(in=data[0..7], out=out);
      }
    `);
    expect(simulate(def, { data: 0x0000 }, registry)).toEqual({ out: 0 });
    expect(simulate(def, { data: 0x0001 }, registry)).toEqual({ out: 1 });
    expect(simulate(def, { data: 0x00FF }, registry)).toEqual({ out: 1 });
    // Upper byte only — bits 0..7 are all 0
    expect(simulate(def, { data: 0xFF00 }, registry)).toEqual({ out: 0 });
  });

  it('allows different parts to drive different bits of the same wire', () => {
    const registry = new ChipRegistry();
    const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    registry.register('Not', notDef);

    // Two Not gates driving different bits of the same output bus
    const def = parseHDL(`
      CHIP Not2 {
        IN in[2];
        OUT out[2];
        PARTS:
        Not(in=in[0], out=out[0]);
        Not(in=in[1], out=out[1]);
      }
    `);
    expect(simulate(def, { in: 0b00 }, registry)).toEqual({ out: 0b11 });
    expect(simulate(def, { in: 0b11 }, registry)).toEqual({ out: 0b00 });
    expect(simulate(def, { in: 0b01 }, registry)).toEqual({ out: 0b10 });
  });

  it('throws when the same bit of a wire is driven by multiple parts', () => {
    const registry = new ChipRegistry();
    const def = parseHDL(`
      CHIP Bad {
        IN a;
        OUT out[2];
        PARTS:
        Nand(a=a, b=a, out=out[0]);
        Nand(a=a, b=a, out=out[0]);
      }
    `);
    expect(() => simulate(def, { a: 0 }, registry)).toThrow(/Bit 0.*multiple parts/);
  });

  it('simulates Add16 from HalfAdder and FullAdders with carry chain', () => {
    const registry = new ChipRegistry();
    // Register prerequisite chips
    const notDef = parseHDL('CHIP Not { IN in; OUT out; PARTS: Nand(a=in, b=in, out=out); }');
    registry.register('Not', notDef);
    const andDef = parseHDL('CHIP And { IN a, b; OUT out; PARTS: Nand(a=a, b=b, out=n); Not(in=n, out=out); }');
    registry.register('And', andDef);
    const orDef = parseHDL('CHIP Or { IN a, b; OUT out; PARTS: Not(in=a, out=na); Not(in=b, out=nb); Nand(a=na, b=nb, out=out); }');
    registry.register('Or', orDef);
    const xorDef = parseHDL('CHIP Xor { IN a, b; OUT out; PARTS: Not(in=a, out=na); Not(in=b, out=nb); And(a=a, b=nb, out=w1); And(a=na, b=b, out=w2); Or(a=w1, b=w2, out=out); }');
    registry.register('Xor', xorDef);
    const haDef = parseHDL('CHIP HalfAdder { IN a, b; OUT sum, carry; PARTS: Xor(a=a, b=b, out=sum); And(a=a, b=b, out=carry); }');
    registry.register('HalfAdder', haDef);
    const faDef = parseHDL('CHIP FullAdder { IN a, b, c; OUT sum, carry; PARTS: HalfAdder(a=a, b=b, sum=s1, carry=c1); HalfAdder(a=s1, b=c, sum=sum, carry=c2); Or(a=c1, b=c2, out=carry); }');
    registry.register('FullAdder', faDef);

    const add16Src = `
      CHIP Add16 {
        IN a[16], b[16];
        OUT out[16];
        PARTS:
        HalfAdder(a=a[0], b=b[0], sum=out[0], carry=c0);
        ${Array.from({ length: 15 }, (_, i) => {
          const bit = i + 1;
          const prevCarry = `c${i}`;
          const carry = bit < 15 ? `c${bit}` : `drop`;
          return `FullAdder(a=a[${bit}], b=b[${bit}], c=${prevCarry}, sum=out[${bit}], carry=${carry});`;
        }).join('\n        ')}
      }
    `;
    const add16Def = parseHDL(add16Src);
    expect(simulate(add16Def, { a: 0, b: 0 }, registry)).toEqual({ out: 0 });
    expect(simulate(add16Def, { a: 1, b: 1 }, registry)).toEqual({ out: 2 });
    expect(simulate(add16Def, { a: 0xFFFF, b: 1 }, registry)).toEqual({ out: 0 }); // overflow wraps
    expect(simulate(add16Def, { a: 0x00FF, b: 0xFF00 }, registry)).toEqual({ out: 0xFFFF });
  });
});
