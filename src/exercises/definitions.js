export const EXERCISES = [
  // Chapter 1 — Single-bit gates
  {
    id: 'not',
    name: 'Not',
    chapter: 1,
    description: 'Outputs the opposite of its input.',
    analogy: 'Like a light switch \u2014 flipping it reverses the state.',
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
    hints: [
      'out = \u00ACin',
      'NAND(x, x) = \u00ACx \u2014 a NAND gate with both inputs tied together acts as NOT',
    ],
    tutorial: true,
    tutorialLeadIn: "This first exercise is a walkthrough. We\u2019ll build a chip together, step by step.",
    tutorialSteps: [
      {
        code: `CHIP Not {
    IN in;
    OUT out;

    PARTS:
    // Your code here
}`,
        explanation: 'This is the skeleton for a Not gate. It takes one input (in) and produces one output (out). Your only building block is NAND \u2014 a gate that outputs 0 only when both inputs are 1.',
      },
      {
        code: `CHIP Not {
    IN in;
    OUT out;

    PARTS:
    Nand(a=in, b=in, out=out);
}`,
        explanation: 'If you feed the same signal to both inputs of a NAND gate, it behaves exactly like NOT. When in=0, NAND(0,0)=1. When in=1, NAND(1,1)=0. That\u2019s inversion! Click Run to verify.',
      },
    ],
  },
  {
    id: 'and',
    name: 'And',
    chapter: 1,
    description: 'Outputs 1 only when both inputs are 1.',
    analogy: 'Like a bank vault that requires two keys turned at the same time.',
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
    hints: [
      'out = a \u2227 b',
      'a \u2227 b = \u00AC(a NAND b) \u2014 negate the NAND of a and b',
    ],
  },
  {
    id: 'or',
    name: 'Or',
    chapter: 1,
    description: 'Outputs 1 when at least one input is 1.',
    analogy: 'Like a car\u2019s dome light \u2014 it turns on if any door is open (one, the other, or both).',
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
    hints: [
      'out = a \u2228 b',
      'By De Morgan\u2019s law: a \u2228 b = \u00AC(\u00ACa \u2227 \u00ACb)',
      'a \u2228 b = NAND(\u00ACa, \u00ACb) \u2014 negate each input, then NAND them',
    ],
  },
  {
    id: 'xor',
    name: 'Xor',
    chapter: 1,
    description: 'Outputs 1 when exactly one input is 1, but not both.',
    analogy: 'Like choosing soup or salad at a restaurant \u2014 you can have one, but not both.',
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
    hints: [
      'out = a \u2295 b',
      'a \u2295 b = (a \u2227 \u00ACb) \u2228 (\u00ACa \u2227 b)',
      'You can build this from And, Or, and Not gates',
    ],
  },
  {
    id: 'mux',
    name: 'Mux',
    chapter: 1,
    description: 'Selects one of two inputs based on a selector bit.',
    analogy: 'Like a TV remote\u2019s input button \u2014 choose between HDMI 1 or HDMI 2.',
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
    hints: [
      'When sel = 0, out = a. When sel = 1, out = b.',
      'out = (a \u2227 \u00ACsel) \u2228 (b \u2227 sel)',
      'Use And, Or, and Not to implement this expression',
    ],
  },
  {
    id: 'dmux',
    name: 'DMux',
    chapter: 1,
    description: 'Routes a single input to one of two outputs based on a selector bit.',
    analogy: 'Like a mail sorter \u2014 one incoming letter, routed to one of two mailboxes.',
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
    hints: [
      'a = in \u2227 \u00ACsel, b = in \u2227 sel',
      'Use And and Not gates for each output',
    ],
  },

  // Chapter 1 — Multi-bit gates
  {
    id: 'not16',
    name: 'Not16',
    chapter: 1,
    description: 'Applies Not to each of the 16 bits independently.',
    analogy: null,
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
    hints: [
      'Apply the single-bit operation to each bit independently',
      'out[i] = \u00ACin[i] for each bit i from 0 to 15',
    ],
  },
  {
    id: 'and16',
    name: 'And16',
    chapter: 1,
    description: 'Applies And to each pair of bits independently.',
    analogy: null,
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
    hints: [
      'Apply the single-bit operation to each pair of bits independently',
      'out[i] = a[i] \u2227 b[i] for each bit i from 0 to 15',
    ],
  },
  {
    id: 'or16',
    name: 'Or16',
    chapter: 1,
    description: 'Applies Or to each pair of bits independently.',
    analogy: null,
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
    hints: [
      'Apply the single-bit operation to each pair of bits independently',
      'out[i] = a[i] \u2228 b[i] for each bit i from 0 to 15',
    ],
  },
  {
    id: 'mux16',
    name: 'Mux16',
    chapter: 1,
    description: 'Selects one of two 16-bit inputs based on a selector bit.',
    analogy: null,
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
    hints: [
      'Apply the single-bit Mux to each bit independently',
      'out[i] = Mux(a[i], b[i], sel) for each bit i from 0 to 15',
    ],
  },
  {
    id: 'or8way',
    name: 'Or8Way',
    chapter: 1,
    description: 'Outputs 1 if any of the 8 input bits is 1.',
    analogy: 'Like a fire alarm system \u2014 if any sensor triggers, the alarm sounds.',
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
    hints: [
      'out = in[0] \u2228 in[1] \u2228 ... \u2228 in[7]',
      'Build a tree: OR pairs together, then OR the results',
    ],
  },
  {
    id: 'mux4way16',
    name: 'Mux4Way16',
    chapter: 1,
    description: 'Selects one of four 16-bit inputs using a 2-bit selector.',
    analogy: 'Like a 4-channel input selector.',
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
    hints: [
      'sel has 2 bits. Use sel[0] to choose within pairs, sel[1] to choose between pairs.',
      'First Mux16 a,b and c,d using sel[0], then Mux16 the two results using sel[1]',
    ],
  },
  {
    id: 'mux8way16',
    name: 'Mux8Way16',
    chapter: 1,
    description: 'Selects one of eight 16-bit inputs using a 3-bit selector.',
    analogy: 'Like an 8-channel input selector.',
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
    hints: [
      'sel has 3 bits. Extend the Mux4Way16 pattern with one more stage.',
      'Use two Mux4Way16 gates for groups of 4, then a Mux16 to choose between them using sel[2]',
    ],
  },
  {
    id: 'dmux4way',
    name: 'DMux4Way',
    chapter: 1,
    description: 'Routes a single input to one of four outputs using a 2-bit selector.',
    analogy: 'Like a train switch with four tracks.',
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
    hints: [
      'sel has 2 bits. Demux in two stages.',
      'First DMux by sel[1] into two groups, then DMux each group by sel[0]',
    ],
  },
  {
    id: 'dmux8way',
    name: 'DMux8Way',
    chapter: 1,
    description: 'Routes a single input to one of eight outputs using a 3-bit selector.',
    analogy: 'Like a post office sorting machine with eight bins.',
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
    hints: [
      'sel has 3 bits. Extend the DMux4Way pattern with one more stage.',
      'First DMux by sel[2], then DMux4Way each result using sel[0..1]',
    ],
  },

  // Chapter 2 — Boolean Arithmetic
  {
    id: 'half-adder',
    name: 'HalfAdder',
    chapter: 2,
    description: 'Adds two single bits, producing a sum and a carry.',
    analogy: 'Like adding two single-digit numbers and noting whether you carry.',
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
    hints: [
      'sum = a \u2295 b, carry = a \u2227 b',
      'XOR gives the sum bit, AND gives the carry bit',
    ],
  },
  {
    id: 'full-adder',
    name: 'FullAdder',
    chapter: 2,
    description: 'Adds two bits plus a carry-in, producing a sum and carry-out.',
    analogy: 'Like adding a column of digits in long addition, including the carry from the previous column.',
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
    hints: [
      'sum = a \u2295 b \u2295 c',
      'Use two HalfAdders: first add a and b, then add that sum with c',
      'carry = carry\u2081 \u2228 carry\u2082 \u2014 OR the two carry outputs together',
    ],
  },
  {
    id: 'add16',
    name: 'Add16',
    chapter: 2,
    description: 'Adds two 16-bit numbers.',
    analogy: 'Like stacking 16 FullAdders to do long addition in binary.',
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
    hints: [
      'Chain adders: HalfAdder for bit 0, FullAdder for bits 1\u201315',
      'Connect each carry output to the next FullAdder\u2019s carry input',
    ],
  },
  {
    id: 'inc16',
    name: 'Inc16',
    chapter: 2,
    description: 'Adds 1 to a 16-bit number.',
    analogy: 'Like an odometer clicking forward by one.',
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
    hints: [
      'Incrementing is the same as adding 1',
      'Use a HalfAdder for bit 0 with b=true, then FullAdders for bits 1\u201315 with b=false',
    ],
  },
  {
    id: 'alu',
    name: 'ALU',
    chapter: 2,
    description: 'Performs one of several arithmetic or logical operations based on 6 control bits.',
    analogy: 'Like a calculator\u2019s brain \u2014 one chip that can add, subtract, negate, or compare depending on which buttons are pressed.',
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
    hints: [
      'Process x and y independently: first zero (zx/zy), then negate (nx/ny)',
      'Use Mux16 to select: if zx then 0 else x. Then if nx, negate the result.',
      'f selects Add16 (f=1) or And16 (f=0). Then if no, negate the output.',
      'zr = 1 when out = 0 (use Or8Way on both halves). ng = out[15] (the sign bit).',
    ],
  },
];
