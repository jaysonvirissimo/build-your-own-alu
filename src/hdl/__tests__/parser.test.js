import { describe, it, expect } from 'vitest';
import { parseHDL } from '../parser.js';

const conn = (subPin, wire) => ({
  subPin, subBus: null, wire, wireBus: null, isConstant: false,
});

describe('parseHDL', () => {
  it('parses a minimal chip with no parts', () => {
    const ast = parseHDL('CHIP Foo { IN a; OUT b; PARTS: }');
    expect(ast.name).toBe('Foo');
    expect(ast.inputs).toEqual([{ name: 'a', width: 1 }]);
    expect(ast.outputs).toEqual([{ name: 'b', width: 1 }]);
    expect(ast.parts).toEqual([]);
  });

  it('parses Not (one part, one input, one output)', () => {
    const ast = parseHDL(`
      CHIP Not {
        IN in;
        OUT out;
        PARTS:
        Nand(a=in, b=in, out=out);
      }
    `);
    expect(ast.name).toBe('Not');
    expect(ast.inputs).toEqual([{ name: 'in', width: 1 }]);
    expect(ast.outputs).toEqual([{ name: 'out', width: 1 }]);
    expect(ast.parts).toEqual([
      {
        chipName: 'Nand',
        connections: [conn('a', 'in'), conn('b', 'in'), conn('out', 'out')],
      },
    ]);
  });

  it('parses a chip with multiple parts and internal pins', () => {
    const ast = parseHDL(`
      CHIP And {
        IN a, b;
        OUT out;
        PARTS:
        Nand(a=a, b=b, out=nandOut);
        Not(in=nandOut, out=out);
      }
    `);
    expect(ast.name).toBe('And');
    expect(ast.inputs).toEqual([
      { name: 'a', width: 1 },
      { name: 'b', width: 1 },
    ]);
    expect(ast.parts).toHaveLength(2);
    expect(ast.parts[0].chipName).toBe('Nand');
    expect(ast.parts[1].chipName).toBe('Not');
    expect(ast.parts[1].connections).toEqual([
      conn('in', 'nandOut'),
      conn('out', 'out'),
    ]);
  });

  it('parses a chip with multiple outputs', () => {
    const ast = parseHDL(`
      CHIP DMux {
        IN in, sel;
        OUT a, b;
        PARTS:
      }
    `);
    expect(ast.outputs).toEqual([
      { name: 'a', width: 1 },
      { name: 'b', width: 1 },
    ]);
  });

  it('ignores single-line comments', () => {
    const ast = parseHDL(`
      // This is a Not gate
      CHIP Not {
        IN in;
        OUT out;
        PARTS:
        // Negate using Nand
        Nand(a=in, b=in, out=out);
      }
    `);
    expect(ast.name).toBe('Not');
    expect(ast.parts).toHaveLength(1);
  });

  it('ignores block comments', () => {
    const ast = parseHDL(`
      /* A Not gate */
      CHIP Not {
        IN in;
        OUT out;
        PARTS:
        /* negate */ Nand(a=in, b=in, out=out);
      }
    `);
    expect(ast.name).toBe('Not');
    expect(ast.parts).toHaveLength(1);
  });

  // Bus notation tests

  it('parses pin declarations with width', () => {
    const ast = parseHDL('CHIP Foo { IN a[16]; OUT b[16]; PARTS: }');
    expect(ast.inputs).toEqual([{ name: 'a', width: 16 }]);
    expect(ast.outputs).toEqual([{ name: 'b', width: 16 }]);
  });

  it('parses mixed-width pin declarations', () => {
    const ast = parseHDL('CHIP Mux16 { IN a[16], b[16], sel; OUT out[16]; PARTS: }');
    expect(ast.inputs).toEqual([
      { name: 'a', width: 16 },
      { name: 'b', width: 16 },
      { name: 'sel', width: 1 },
    ]);
    expect(ast.outputs).toEqual([{ name: 'out', width: 16 }]);
  });

  it('parses wire-side indexing in connections', () => {
    const ast = parseHDL(`
      CHIP Not16 {
        IN in[16];
        OUT out[16];
        PARTS:
        Not(in=in[0], out=out[0]);
      }
    `);
    expect(ast.parts[0].connections).toEqual([
      { subPin: 'in', subBus: null, wire: 'in', wireBus: { index: 0 }, isConstant: false },
      { subPin: 'out', subBus: null, wire: 'out', wireBus: { index: 0 }, isConstant: false },
    ]);
  });

  it('parses wire-side slicing in connections', () => {
    const ast = parseHDL(`
      CHIP Foo {
        IN in[16];
        OUT out;
        PARTS:
        Or8Way(in=in[0..7], out=out);
      }
    `);
    expect(ast.parts[0].connections[0]).toEqual({
      subPin: 'in', subBus: null,
      wire: 'in', wireBus: { start: 0, end: 7 },
      isConstant: false,
    });
  });

  it('parses sub-pin indexing in connections', () => {
    const ast = parseHDL(`
      CHIP Inc16 {
        IN in[16];
        OUT out[16];
        PARTS:
        Add16(a=in, b[0]=true, b[1..15]=false, out=out);
      }
    `);
    const conns = ast.parts[0].connections;
    expect(conns[0]).toEqual(conn('a', 'in'));
    expect(conns[1]).toEqual({
      subPin: 'b', subBus: { index: 0 },
      wire: 'true', wireBus: null,
      isConstant: true,
    });
    expect(conns[2]).toEqual({
      subPin: 'b', subBus: { start: 1, end: 15 },
      wire: 'false', wireBus: null,
      isConstant: true,
    });
    expect(conns[3]).toEqual(conn('out', 'out'));
  });

  it('parses constants (true/false)', () => {
    const ast = parseHDL(`
      CHIP Foo {
        IN sel;
        OUT out[16];
        PARTS:
        Mux16(a=true, b=false, sel=sel, out=out);
      }
    `);
    const conns = ast.parts[0].connections;
    expect(conns[0]).toEqual({
      subPin: 'a', subBus: null, wire: 'true', wireBus: null, isConstant: true,
    });
    expect(conns[1]).toEqual({
      subPin: 'b', subBus: null, wire: 'false', wireBus: null, isConstant: true,
    });
    expect(conns[2]).toEqual(conn('sel', 'sel'));
  });

  // Error tests

  it('throws on empty source', () => {
    expect(() => parseHDL('')).toThrow();
  });

  it('throws on missing CHIP keyword', () => {
    expect(() => parseHDL('Not { IN in; OUT out; PARTS: }')).toThrow(/CHIP/);
  });

  it('throws on missing semicolon after pin list', () => {
    expect(() => parseHDL('CHIP Foo { IN a OUT b; PARTS: }')).toThrow(/SEMICOLON/);
  });

  it('throws on missing closing brace', () => {
    expect(() => parseHDL('CHIP Foo { IN a; OUT b; PARTS:')).toThrow();
  });

  it('throws on unexpected character with line info', () => {
    expect(() => parseHDL('CHIP Foo { IN a; OUT b; PARTS: @bad }')).toThrow(/col/);
  });

  it('throws on trailing content after chip definition', () => {
    expect(() =>
      parseHDL('CHIP Foo { IN a; OUT b; PARTS: } extra')
    ).toThrow(/Unexpected content/);
  });

  it('throws on single dot', () => {
    expect(() =>
      parseHDL('CHIP Foo { IN a[16]; OUT b; PARTS: Bar(x=a[0.7]); }')
    ).toThrow(/\.\./);
  });

  it('throws on unmatched bracket in pin declaration', () => {
    expect(() => parseHDL('CHIP Foo { IN a[16; OUT b; PARTS: }')).toThrow();
  });

  it('throws on unterminated block comment', () => {
    expect(() => parseHDL('/* unclosed CHIP Foo { IN a; OUT b; PARTS: }')).toThrow(/block comment/);
  });
});
