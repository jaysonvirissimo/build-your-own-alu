import { describe, it, expect } from 'vitest';
import { parseHDL } from '../parser.js';

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
        connections: [
          { subPin: 'a', wire: 'in' },
          { subPin: 'b', wire: 'in' },
          { subPin: 'out', wire: 'out' },
        ],
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
      { subPin: 'in', wire: 'nandOut' },
      { subPin: 'out', wire: 'out' },
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
});
