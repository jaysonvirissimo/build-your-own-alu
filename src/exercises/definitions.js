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
    tutorial: true,
    tutorialLeadIn: "Xor is the first chip that needs internal wires. Naming them well matters \u2014 we\u2019ll build it twice, first with bad names, then rename.",
    tutorialSteps: [
      {
        code: `CHIP Xor {
    IN a, b;
    OUT out;

    PARTS:
    // Your code here
}`,
        explanation: 'Xor = (a \u2227 \u00ACb) \u2228 (\u00ACa \u2227 b). To express that you need four intermediate signals: \u00ACa, \u00ACb, a \u2227 \u00ACb, and \u00ACa \u2227 b. Every intermediate signal travels on a wire, and every wire needs a name. Click "Walk me through it" to see two versions.',
      },
      {
        code: `CHIP Xor {
    IN a, b;
    OUT out;

    PARTS:
    Not(in=a, out=w1);
    Not(in=b, out=w2);
    And(a=a, b=w2, out=w3);
    And(a=w1, b=b, out=w4);
    Or(a=w3, b=w4, out=out);
}`,
        explanation: 'This works, but what do w1..w4 mean? To read this chip you have to mentally re-derive each wire. A week from now you will not remember. Names like w1 leak the order you wrote things \u2014 they describe position, not meaning.',
      },
      {
        code: `CHIP Xor {
    IN a, b;
    OUT out;

    PARTS:
    Not(in=a, out=notA);
    Not(in=b, out=notB);
    And(a=a, b=notB, out=aAndNotB);
    And(a=notA, b=b, out=notAAndB);
    Or(a=aAndNotB, b=notAAndB, out=out);
}`,
        explanation: 'Same circuit, but each wire is now named after the signal it carries. notA = \u00ACa. aAndNotB = a \u2227 \u00ACb. The rule: name a wire for what it is, not where it sits. Camel-case reads well: notA, aAndNotB. Click Run to verify.',
      },
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
    preamble: `
      <summary>Working with multi-bit buses</summary>
      <p>Until now, every pin has been a single bit. Starting with <code>Not16</code>, chips carry <strong>buses</strong> \u2014 groups of wires bundled under one name. Four new pieces of syntax show up here:</p>
      <p><strong>Declaring a bus width</strong> \u2014 the square-bracketed number after a pin name is the bus width:</p>
      <pre><code>IN in[16];
OUT out[16];</code></pre>
      <p><strong>Indexing a single bit</strong> \u2014 use <code>name[i]</code> to read or drive one bit of a bus. Bits are numbered from 0:</p>
      <pre><code>Not(in=in[0], out=out[0]);
Not(in=in[15], out=out[15]);</code></pre>
      <p><strong>Slicing a range</strong> \u2014 <code>name[a..b]</code> picks contiguous bits (you\u2019ll see this in later exercises like <code>Or8Way</code> and <code>Mux4Way16</code>):</p>
      <pre><code>Or8Way(in=in[0..7], out=lowOr);</code></pre>
      <p><strong>Wiring a whole bus</strong> \u2014 if the widths match, drop the brackets and pass the bus by name:</p>
      <pre><code>And16(a=x, b=y, out=z);</code></pre>
    `,
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
      'Each bit is independent: wire up 16 Not parts, one per bit, using bit-indexing like Not(in=in[0], out=out[0]); \u2026 Not(in=in[15], out=out[15]); \u2014 see the \u201CWorking with multi-bit buses\u201D box above.',
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
      { label: 'sel=0 \u2192 a', a: 0x1111, b: 0x2222, c: 0x3333, d: 0x4444, sel: 0, out: 0x1111 },
      { label: 'sel=1 \u2192 b', a: 0x1111, b: 0x2222, c: 0x3333, d: 0x4444, sel: 1, out: 0x2222 },
      { label: 'sel=2 \u2192 c', a: 0x1111, b: 0x2222, c: 0x3333, d: 0x4444, sel: 2, out: 0x3333 },
      { label: 'sel=3 \u2192 d', a: 0x1111, b: 0x2222, c: 0x3333, d: 0x4444, sel: 3, out: 0x4444 },
    ],
    hints: [
      'sel has 2 bits. Use sel[0] to choose within pairs, sel[1] to choose between pairs.',
      'First Mux16 a,b and c,d using sel[0], then Mux16 the two results using sel[1]',
      'Canonical wire names: Mux16(a=a, b=b, sel=sel[0], out=ab); Mux16(a=c, b=d, sel=sel[0], out=cd); Mux16(a=ab, b=cd, sel=sel[1], out=out). Each internal wire is named after the pair it came from.',
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
      'Canonical wire names: DMux(in=in, sel=sel[1], a=top, b=bottom); DMux(in=top, sel=sel[0], a=a, b=b); DMux(in=bottom, sel=sel[0], a=c, b=d). "top" and "bottom" describe the two branches after the first split.',
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
      'Canonical wire names: HalfAdder(a=a, b=b, sum=ab, carry=carry1); HalfAdder(a=ab, b=c, sum=sum, carry=carry2); Or(a=carry1, b=carry2, out=carry). "ab" = a added to b; carry1/carry2 distinguish the two half-adders.',
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
    id: 'alu-preprocess',
    name: 'ALUPreprocess',
    chapter: 2,
    description: 'Applies the ALU\u2019s input-conditioning stage: for each of x and y, optionally zero the value, then optionally negate it.',
    analogy: 'Like adjusting two audio channels before mixing \u2014 first choose whether to mute, then whether to invert the signal.',
    inputs: ['x', 'y', 'zx', 'nx', 'zy', 'ny'],
    outputs: ['xOut', 'yOut'],
    skeleton: `CHIP ALUPreprocess {
    IN x[16], y[16], zx, nx, zy, ny;
    OUT xOut[16], yOut[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      // x pipeline exercised, y passed through
      { x: 0x1234, y: 0x5678, zx: 0, nx: 0, zy: 0, ny: 0, xOut: 0x1234, yOut: 0x5678 },
      { x: 0x1234, y: 0x5678, zx: 1, nx: 0, zy: 0, ny: 0, xOut: 0x0000, yOut: 0x5678 },
      { x: 0x1234, y: 0x5678, zx: 0, nx: 1, zy: 0, ny: 0, xOut: 0xEDCB, yOut: 0x5678 },
      { x: 0x1234, y: 0x5678, zx: 1, nx: 1, zy: 0, ny: 0, xOut: 0xFFFF, yOut: 0x5678 },
      // y pipeline exercised, x passed through
      { x: 0x00FF, y: 0x00FF, zx: 0, nx: 0, zy: 0, ny: 0, xOut: 0x00FF, yOut: 0x00FF },
      { x: 0x00FF, y: 0x00FF, zx: 0, nx: 0, zy: 1, ny: 0, xOut: 0x00FF, yOut: 0x0000 },
      { x: 0x00FF, y: 0x00FF, zx: 0, nx: 0, zy: 0, ny: 1, xOut: 0x00FF, yOut: 0xFF00 },
      { x: 0x00FF, y: 0x00FF, zx: 0, nx: 0, zy: 1, ny: 1, xOut: 0x00FF, yOut: 0xFFFF },
      // Both sides active \u2014 matches the ALU\u2019s x-y intermediate stage
      { x: 0x0011, y: 0x0003, zx: 0, nx: 1, zy: 0, ny: 0, xOut: 0xFFEE, yOut: 0x0003 },
      // Both sides active \u2014 matches the ALU\u2019s x|y intermediate (De Morgan)
      { x: 0x0011, y: 0x0003, zx: 0, nx: 1, zy: 0, ny: 1, xOut: 0xFFEE, yOut: 0xFFFC },
      // Mixed constants: -1 on x, 0 on y
      { x: 0xABCD, y: 0x1234, zx: 1, nx: 1, zy: 1, ny: 0, xOut: 0xFFFF, yOut: 0x0000 },
    ],
    hints: [
      'Each side (x and y) is independent. Build two identical little pipelines: first an optional zero, then an optional negate.',
      'For the zero step, Mux16 is your friend: Mux16(a=x, b=false, sel=zx, out=xZeroed) picks x when zx=0, and all-zeros when zx=1.',
      'For the negate step, compute Not16 of the zeroed value, then Mux16 between the zeroed value and its negation, selected by nx.',
      'Mirror the same two-Mux16 / one-Not16 wiring for y using zy and ny, ending in xOut and yOut.',
    ],
  },
  {
    id: 'alu-core',
    name: 'ALUCompute',
    chapter: 2,
    description: 'The arithmetic/logic heart of the ALU: computes x+y when f=1, or x\u2227y when f=0.',
    analogy: 'Like a calculator\u2019s mode switch \u2014 one button flips the same two inputs between \u201Cadd\u201D and \u201Cand\u201D.',
    inputs: ['x', 'y', 'f'],
    outputs: ['out'],
    skeleton: `CHIP ALUCompute {
    IN x[16], y[16], f;
    OUT out[16];

    PARTS:
    // Your code here
}`,
    truthTable: [
      // f = 1 (add)
      { x: 0x0000, y: 0x0000, f: 1, out: 0x0000 },
      { x: 0x0001, y: 0x0001, f: 1, out: 0x0002 },
      { x: 0x00FF, y: 0xFF00, f: 1, out: 0xFFFF },
      { x: 0x1234, y: 0x5678, f: 1, out: 0x68AC },
      // f=1 on preprocessed inputs (matches ALU x-y intermediate)
      { x: 0xFFEE, y: 0x0003, f: 1, out: 0xFFF1 },
      // f = 0 (and)
      { x: 0x0000, y: 0xFFFF, f: 0, out: 0x0000 },
      { x: 0xFFFF, y: 0xFFFF, f: 0, out: 0xFFFF },
      { x: 0xAAAA, y: 0x5555, f: 0, out: 0x0000 },
      { x: 0x1234, y: 0x5678, f: 0, out: 0x1230 },
      // f=0 on preprocessed inputs (matches ALU x|y intermediate via De Morgan)
      { x: 0xFFEE, y: 0xFFFC, f: 0, out: 0xFFEC },
    ],
    hints: [
      'This chip has two possible outputs \u2014 an Add16 result and an And16 result \u2014 and f picks between them.',
      'Compute both in parallel: Add16(a=x, b=y, out=sum); And16(a=x, b=y, out=andOut);',
      'Then one Mux16 with sel=f finishes it: pass sum when f=1, andOut when f=0.',
    ],
  },
  {
    id: 'alu-postprocess',
    name: 'ALUPostprocess',
    chapter: 2,
    description: 'Finishes the ALU: optionally negates the 16-bit result, then computes the zero (zr) and negative (ng) status flags.',
    analogy: 'Like the last stage of a camera pipeline \u2014 apply a final color inversion if requested, then stamp two metadata flags on the image.',
    preamble: `
      <summary>Splitting an output to two wires</summary>
      <p>So far, each chip\u2019s output has gone to exactly one wire. This chip needs something new: the final value of <code>out</code> must also be read back internally to compute <code>zr</code> (is it zero?) and <code>ng</code> (is it negative?).</p>
      <p>HDL does not let you read from an OUT pin as input to another part. Instead, list the same sub-pin twice with different wires \u2014 the value flows to both:</p>
      <pre><code>Mux16(a=in, b=notIn, sel=no, out=out, out=outCopy);</code></pre>
      <p>Now <code>outCopy</code> is an internal wire you can feed into other parts (e.g. <code>Or8Way</code> to detect zero), while <code>out</code> still leaves the chip as the 16-bit result.</p>
    `,
    inputs: ['in', 'no'],
    outputs: ['out', 'zr', 'ng'],
    skeleton: `CHIP ALUPostprocess {
    IN in[16], no;
    OUT out[16], zr, ng;

    PARTS:
    // Your code here
}`,
    truthTable: [
      // no=0: out=in; flags reflect in
      { in: 0x0011, no: 0, out: 0x0011, zr: 0, ng: 0 },
      { in: 0x0000, no: 0, out: 0x0000, zr: 1, ng: 0 },
      { in: 0xFFFF, no: 0, out: 0xFFFF, zr: 0, ng: 1 },
      { in: 0xFFF1, no: 0, out: 0xFFF1, zr: 0, ng: 1 },
      { in: 0x8000, no: 0, out: 0x8000, zr: 0, ng: 1 },
      // no=1: out = !in; flags reflect the negation
      { in: 0xFFFF, no: 1, out: 0x0000, zr: 1, ng: 0 },
      { in: 0x0000, no: 1, out: 0xFFFF, zr: 0, ng: 1 },
      { in: 0xFFF1, no: 1, out: 0x000E, zr: 0, ng: 0 },
      { in: 0xFFEC, no: 1, out: 0x0013, zr: 0, ng: 0 },
      { in: 0x7FFF, no: 1, out: 0x8000, zr: 0, ng: 1 },
    ],
    hints: [
      'Structure: (1) optionally negate in, (2) send that value to out, (3) also feed the same value into logic that computes zr and ng.',
      'For the optional negate: Not16(in=in, out=notIn); Mux16(a=in, b=notIn, sel=no, out=out, out=outCopy); \u2014 see the box above for why we name the output twice.',
      'ng is simply the sign bit: out[15]. You can read it by adding out[15]=ng to the Mux16\u2019s output bindings.',
      'zr = 1 only when all 16 bits of out are 0. Split outCopy into halves, run Or8Way on each, OR the two results together, and invert \u2014 that is zr.',
      'To split outCopy into halves, add out[0..7]=outLow and out[8..15]=outHigh to the same Mux16 \u2014 HDL lets you bind any number of output slices at once.',
    ],
  },
  {
    id: 'alu',
    name: 'ALU',
    chapter: 2,
    description: 'Performs one of several arithmetic or logical operations based on 6 control bits. Composes ALUPreprocess, ALUCompute, and ALUPostprocess into a single 16-bit ALU.',
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
      { label: '0', x: 0x0000, y: 0xFFFF, zx: 1, nx: 0, zy: 1, ny: 0, f: 1, no: 0, out: 0x0000, zr: 1, ng: 0 },
      { label: '1', x: 0x0000, y: 0xFFFF, zx: 1, nx: 1, zy: 1, ny: 1, f: 1, no: 1, out: 0x0001, zr: 0, ng: 0 },
      { label: '-1', x: 0x0000, y: 0xFFFF, zx: 1, nx: 1, zy: 1, ny: 0, f: 1, no: 0, out: 0xFFFF, zr: 0, ng: 1 },
      { label: 'x', x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 1, ny: 1, f: 0, no: 0, out: 0x0011, zr: 0, ng: 0 },
      { label: 'y', x: 0x0011, y: 0x0003, zx: 1, nx: 1, zy: 0, ny: 0, f: 0, no: 0, out: 0x0003, zr: 0, ng: 0 },
      { label: '\u00ACx', x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 1, ny: 1, f: 0, no: 1, out: 0xFFEE, zr: 0, ng: 1 },
      { label: '-x', x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 1, ny: 1, f: 1, no: 1, out: 0xFFEF, zr: 0, ng: 1 },
      { label: 'x+1', x: 0x0011, y: 0x0003, zx: 0, nx: 1, zy: 1, ny: 1, f: 1, no: 1, out: 0x0012, zr: 0, ng: 0 },
      { label: 'x+y', x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 0, ny: 0, f: 1, no: 0, out: 0x0014, zr: 0, ng: 0 },
      { label: 'x-y', x: 0x0011, y: 0x0003, zx: 0, nx: 1, zy: 0, ny: 0, f: 1, no: 1, out: 0x000E, zr: 0, ng: 0 },
      { label: 'x\u2227y', x: 0x0011, y: 0x0003, zx: 0, nx: 0, zy: 0, ny: 0, f: 0, no: 0, out: 0x0001, zr: 0, ng: 0 },
      { label: 'x\u2228y', x: 0x0011, y: 0x0003, zx: 0, nx: 1, zy: 0, ny: 1, f: 0, no: 1, out: 0x0013, zr: 0, ng: 0 },
    ],
    hints: [
      'You already built every piece. Wire x, y, zx, nx, zy, ny into ALUPreprocess to get conditioned xOut and yOut.',
      'Feed those into ALUCompute along with f. It returns one 16-bit value \u2014 name the internal wire something like computed.',
      'Feed that plus no into ALUPostprocess. Its three outputs are exactly the three outputs of the ALU: out, zr, ng.',
      'If you reached for a Mux16, Not16, Or8Way, Add16, or And16 in this chip, step back \u2014 all of that logic already lives inside the three helper chips.',
    ],
  },
];
