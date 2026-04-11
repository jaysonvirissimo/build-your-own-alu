export const EXERCISES = [
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
];
