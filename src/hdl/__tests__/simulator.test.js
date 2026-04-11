import { describe, it, expect } from 'vitest';
import { simulate } from '../simulator.js';
import { ChipRegistry } from '../chips.js';
import { parseHDL } from '../parser.js';

describe('simulate', () => {
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
    // Use the same input for both Nand inputs (fan-out from 'in')
    const notDef = parseHDL(`
      CHIP Not {
        IN in;
        OUT out;
        PARTS:
        Nand(a=in, b=in, out=out);
      }
    `);
    // in=0 fans out to both a and b of Nand
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
    // Parts listed in reverse dependency order — the second part
    // produces the input that the first part needs
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
});
