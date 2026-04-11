export const EXERCISES = [
  // Chapter 1 — Single-bit gates
  {
    id: 'not',
    name: 'Not',
    chapter: 1,
    inputs: ['in'],
    outputs: ['out'],
    skeleton: `CHIP Not {
    IN in;
    OUT out;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { in: 0, out: 1 },
      { in: 1, out: 0 },
    ],
  },
  {
    id: 'and',
    name: 'And',
    chapter: 1,
    inputs: ['a', 'b'],
    outputs: ['out'],
    skeleton: `CHIP And {
    IN a, b;
    OUT out;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0, b: 0, out: 0 },
      { a: 0, b: 1, out: 0 },
      { a: 1, b: 0, out: 0 },
      { a: 1, b: 1, out: 1 },
    ],
  },
  {
    id: 'or',
    name: 'Or',
    chapter: 1,
    inputs: ['a', 'b'],
    outputs: ['out'],
    skeleton: `CHIP Or {
    IN a, b;
    OUT out;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0, b: 0, out: 0 },
      { a: 0, b: 1, out: 1 },
      { a: 1, b: 0, out: 1 },
      { a: 1, b: 1, out: 1 },
    ],
  },
  {
    id: 'xor',
    name: 'Xor',
    chapter: 1,
    inputs: ['a', 'b'],
    outputs: ['out'],
    skeleton: `CHIP Xor {
    IN a, b;
    OUT out;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0, b: 0, out: 0 },
      { a: 0, b: 1, out: 1 },
      { a: 1, b: 0, out: 1 },
      { a: 1, b: 1, out: 0 },
    ],
  },
  {
    id: 'mux',
    name: 'Mux',
    chapter: 1,
    inputs: ['a', 'b', 'sel'],
    outputs: ['out'],
    skeleton: `CHIP Mux {
    IN a, b, sel;
    OUT out;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0, b: 0, sel: 0, out: 0 },
      { a: 0, b: 0, sel: 1, out: 0 },
      { a: 0, b: 1, sel: 0, out: 0 },
      { a: 0, b: 1, sel: 1, out: 1 },
      { a: 1, b: 0, sel: 0, out: 1 },
      { a: 1, b: 0, sel: 1, out: 0 },
      { a: 1, b: 1, sel: 0, out: 1 },
      { a: 1, b: 1, sel: 1, out: 1 },
    ],
  },
  {
    id: 'dmux',
    name: 'DMux',
    chapter: 1,
    inputs: ['in', 'sel'],
    outputs: ['a', 'b'],
    skeleton: `CHIP DMux {
    IN in, sel;
    OUT a, b;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { in: 0, sel: 0, a: 0, b: 0 },
      { in: 0, sel: 1, a: 0, b: 0 },
      { in: 1, sel: 0, a: 1, b: 0 },
      { in: 1, sel: 1, a: 0, b: 1 },
    ],
  },

  // Chapter 1 — Multi-bit gates
  {
    id: 'not16',
    name: 'Not16',
    chapter: 1,
    inputs: ['in'],
    outputs: ['out'],
    skeleton: `CHIP Not16 {
    IN in[16];
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      { in: 0x0000, out: 0xFFFF },
      { in: 0xFFFF, out: 0x0000 },
      { in: 0xAAAA, out: 0x5555 },
      { in: 0x5555, out: 0xAAAA },
      { in: 0x00FF, out: 0xFF00 },
      { in: 0x1234, out: 0xEDCB },
    ],
  },
  {
    id: 'and16',
    name: 'And16',
    chapter: 1,
    inputs: ['a', 'b'],
    outputs: ['out'],
    skeleton: `CHIP And16 {
    IN a[16], b[16];
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0x0000, b: 0x0000, out: 0x0000 },
      { a: 0xFFFF, b: 0xFFFF, out: 0xFFFF },
      { a: 0xFFFF, b: 0x0000, out: 0x0000 },
      { a: 0xAAAA, b: 0x5555, out: 0x0000 },
      { a: 0xFF00, b: 0x0F0F, out: 0x0F00 },
      { a: 0x1234, b: 0x5678, out: 0x1230 },
    ],
  },
  {
    id: 'or16',
    name: 'Or16',
    chapter: 1,
    inputs: ['a', 'b'],
    outputs: ['out'],
    skeleton: `CHIP Or16 {
    IN a[16], b[16];
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0x0000, b: 0x0000, out: 0x0000 },
      { a: 0xFFFF, b: 0x0000, out: 0xFFFF },
      { a: 0xAAAA, b: 0x5555, out: 0xFFFF },
      { a: 0xFF00, b: 0x0F0F, out: 0xFF0F },
      { a: 0x1234, b: 0x5678, out: 0x567C },
    ],
  },
  {
    id: 'mux16',
    name: 'Mux16',
    chapter: 1,
    inputs: ['a', 'b', 'sel'],
    outputs: ['out'],
    skeleton: `CHIP Mux16 {
    IN a[16], b[16], sel;
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0x0000, b: 0xFFFF, sel: 0, out: 0x0000 },
      { a: 0x0000, b: 0xFFFF, sel: 1, out: 0xFFFF },
      { a: 0xAAAA, b: 0x5555, sel: 0, out: 0xAAAA },
      { a: 0xAAAA, b: 0x5555, sel: 1, out: 0x5555 },
      { a: 0x1234, b: 0x5678, sel: 0, out: 0x1234 },
      { a: 0x1234, b: 0x5678, sel: 1, out: 0x5678 },
    ],
  },
  {
    id: 'or8way',
    name: 'Or8Way',
    chapter: 1,
    inputs: ['in'],
    outputs: ['out'],
    skeleton: `CHIP Or8Way {
    IN in[8];
    OUT out;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { in: 0x00, out: 0 },
      { in: 0xFF, out: 1 },
      { in: 0x01, out: 1 },
      { in: 0x80, out: 1 },
      { in: 0x10, out: 1 },
    ],
  },
  {
    id: 'mux4way16',
    name: 'Mux4Way16',
    chapter: 1,
    inputs: ['a', 'b', 'c', 'd', 'sel'],
    outputs: ['out'],
    skeleton: `CHIP Mux4Way16 {
    IN a[16], b[16], c[16], d[16], sel[2];
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0x1111, b: 0x2222, c: 0x3333, d: 0x4444, sel: 0, out: 0x1111 },
      { a: 0x1111, b: 0x2222, c: 0x3333, d: 0x4444, sel: 1, out: 0x2222 },
      { a: 0x1111, b: 0x2222, c: 0x3333, d: 0x4444, sel: 2, out: 0x3333 },
      { a: 0x1111, b: 0x2222, c: 0x3333, d: 0x4444, sel: 3, out: 0x4444 },
    ],
  },
  {
    id: 'mux8way16',
    name: 'Mux8Way16',
    chapter: 1,
    inputs: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'sel'],
    outputs: ['out'],
    skeleton: `CHIP Mux8Way16 {
    IN a[16], b[16], c[16], d[16], e[16], f[16], g[16], h[16], sel[3];
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0x0001, b: 0x0002, c: 0x0003, d: 0x0004, e: 0x0005, f: 0x0006, g: 0x0007, h: 0x0008, sel: 0, out: 0x0001 },
      { a: 0x0001, b: 0x0002, c: 0x0003, d: 0x0004, e: 0x0005, f: 0x0006, g: 0x0007, h: 0x0008, sel: 1, out: 0x0002 },
      { a: 0x0001, b: 0x0002, c: 0x0003, d: 0x0004, e: 0x0005, f: 0x0006, g: 0x0007, h: 0x0008, sel: 3, out: 0x0004 },
      { a: 0x0001, b: 0x0002, c: 0x0003, d: 0x0004, e: 0x0005, f: 0x0006, g: 0x0007, h: 0x0008, sel: 7, out: 0x0008 },
    ],
  },
  {
    id: 'dmux4way',
    name: 'DMux4Way',
    chapter: 1,
    inputs: ['in', 'sel'],
    outputs: ['a', 'b', 'c', 'd'],
    skeleton: `CHIP DMux4Way {
    IN in, sel[2];
    OUT a, b, c, d;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { in: 0, sel: 0, a: 0, b: 0, c: 0, d: 0 },
      { in: 0, sel: 1, a: 0, b: 0, c: 0, d: 0 },
      { in: 0, sel: 2, a: 0, b: 0, c: 0, d: 0 },
      { in: 0, sel: 3, a: 0, b: 0, c: 0, d: 0 },
      { in: 1, sel: 0, a: 1, b: 0, c: 0, d: 0 },
      { in: 1, sel: 1, a: 0, b: 1, c: 0, d: 0 },
      { in: 1, sel: 2, a: 0, b: 0, c: 1, d: 0 },
      { in: 1, sel: 3, a: 0, b: 0, c: 0, d: 1 },
    ],
  },
  {
    id: 'dmux8way',
    name: 'DMux8Way',
    chapter: 1,
    inputs: ['in', 'sel'],
    outputs: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    skeleton: `CHIP DMux8Way {
    IN in, sel[3];
    OUT a, b, c, d, e, f, g, h;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { in: 1, sel: 0, a: 1, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, h: 0 },
      { in: 1, sel: 1, a: 0, b: 1, c: 0, d: 0, e: 0, f: 0, g: 0, h: 0 },
      { in: 1, sel: 2, a: 0, b: 0, c: 1, d: 0, e: 0, f: 0, g: 0, h: 0 },
      { in: 1, sel: 3, a: 0, b: 0, c: 0, d: 1, e: 0, f: 0, g: 0, h: 0 },
      { in: 1, sel: 4, a: 0, b: 0, c: 0, d: 0, e: 1, f: 0, g: 0, h: 0 },
      { in: 1, sel: 5, a: 0, b: 0, c: 0, d: 0, e: 0, f: 1, g: 0, h: 0 },
      { in: 1, sel: 6, a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 1, h: 0 },
      { in: 1, sel: 7, a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, h: 1 },
    ],
  },

  // Chapter 2 — Boolean Arithmetic
  {
    id: 'half-adder',
    name: 'HalfAdder',
    chapter: 2,
    inputs: ['a', 'b'],
    outputs: ['sum', 'carry'],
    skeleton: `CHIP HalfAdder {
    IN a, b;
    OUT sum, carry;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0, b: 0, sum: 0, carry: 0 },
      { a: 0, b: 1, sum: 1, carry: 0 },
      { a: 1, b: 0, sum: 1, carry: 0 },
      { a: 1, b: 1, sum: 0, carry: 1 },
    ],
  },
  {
    id: 'full-adder',
    name: 'FullAdder',
    chapter: 2,
    inputs: ['a', 'b', 'c'],
    outputs: ['sum', 'carry'],
    skeleton: `CHIP FullAdder {
    IN a, b, c;
    OUT sum, carry;

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0, b: 0, c: 0, sum: 0, carry: 0 },
      { a: 0, b: 0, c: 1, sum: 1, carry: 0 },
      { a: 0, b: 1, c: 0, sum: 1, carry: 0 },
      { a: 0, b: 1, c: 1, sum: 0, carry: 1 },
      { a: 1, b: 0, c: 0, sum: 1, carry: 0 },
      { a: 1, b: 0, c: 1, sum: 0, carry: 1 },
      { a: 1, b: 1, c: 0, sum: 0, carry: 1 },
      { a: 1, b: 1, c: 1, sum: 1, carry: 1 },
    ],
  },
  {
    id: 'add16',
    name: 'Add16',
    chapter: 2,
    inputs: ['a', 'b'],
    outputs: ['out'],
    skeleton: `CHIP Add16 {
    IN a[16], b[16];
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      { a: 0x0000, b: 0x0000, out: 0x0000 },
      { a: 0x0001, b: 0x0001, out: 0x0002 },
      { a: 0xFFFF, b: 0x0001, out: 0x0000 },
      { a: 0x00FF, b: 0xFF00, out: 0xFFFF },
      { a: 0x1234, b: 0x5678, out: 0x68AC },
    ],
  },
  {
    id: 'inc16',
    name: 'Inc16',
    chapter: 2,
    inputs: ['in'],
    outputs: ['out'],
    skeleton: `CHIP Inc16 {
    IN in[16];
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      { in: 0x0000, out: 0x0001 },
      { in: 0x0001, out: 0x0002 },
      { in: 0xFFFF, out: 0x0000 },
      { in: 0x00FF, out: 0x0100 },
      { in: 0x7FFF, out: 0x8000 },
    ],
  },
  {
    id: 'alu',
    name: 'ALU',
    chapter: 2,
    inputs: ['x', 'y', 'zx', 'nx', 'zy', 'ny', 'f', 'no'],
    outputs: ['out', 'zr', 'ng'],
    skeleton: `CHIP ALU {
    IN x[16], y[16], zx, nx, zy, ny, f, no;
    OUT out[16], zr, ng;

    PARTS:
    // Your code here
}`,
    truthTable: [
      // 0
      { x: 0x0000, y: 0xFFFF, zx: 1, nx: 0, zy: 1, ny: 0, f: 1, no: 0, out: 0x0000, zr: 1, ng: 0 },
      // 1
      { x: 0x0000, y: 0xFFFF, zx: 1, nx: 1, zy: 1, ny: 1, f: 1, no: 1, out: 0x0001, zr: 0, ng: 0 },
      // -1
      { x: 0x0000, y: 0xFFFF, zx: 1, nx: 1, zy: 1, ny: 0, f: 1, no: 0, out: 0xFFFF, zr: 0, ng: 1 },
      // x
      { x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 1, ny: 1, f: 0, no: 0, out: 0x0011, zr: 0, ng: 0 },
      // y
      { x: 0x0011, y: 0x0003, zx: 1, nx: 1, zy: 0, ny: 0, f: 0, no: 0, out: 0x0003, zr: 0, ng: 0 },
      // !x
      { x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 1, ny: 1, f: 0, no: 1, out: 0xFFEE, zr: 0, ng: 1 },
      // -x
      { x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 1, ny: 1, f: 1, no: 1, out: 0xFFEF, zr: 0, ng: 1 },
      // x+1
      { x: 0x0011, y: 0x0003, zx: 0, nx: 1, zy: 1, ny: 1, f: 1, no: 1, out: 0x0012, zr: 0, ng: 0 },
      // x+y
      { x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 0, ny: 0, f: 1, no: 0, out: 0x0014, zr: 0, ng: 0 },
      // x-y
      { x: 0x0011, y: 0x0003, zx: 0, nx: 1, zy: 0, ny: 0, f: 1, no: 1, out: 0x000E, zr: 0, ng: 0 },
      // x&y
      { x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 0, ny: 0, f: 0, no: 0, out: 0x0001, zr: 0, ng: 0 },
      // x|y
      { x: 0x0011, y: 0x0003, zx: 0, nx: 1, zy: 0, ny: 1, f: 0, no: 1, out: 0x0013, zr: 0, ng: 0 },
    ],
  },
];
