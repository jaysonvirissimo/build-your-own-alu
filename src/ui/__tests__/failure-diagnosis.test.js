import { describe, it, expect } from 'vitest';
import { diagnoseFailure } from '../failure-diagnosis.js';

const notExercise = {
  inputs: ['in'],
  outputs: ['out'],
  truthTable: [
    { in: 0, out: 1 },
    { in: 1, out: 0 },
  ],
};

const andExercise = {
  inputs: ['a', 'b'],
  outputs: ['out'],
  truthTable: [
    { a: 0, b: 0, out: 0 },
    { a: 0, b: 1, out: 0 },
    { a: 1, b: 0, out: 0 },
    { a: 1, b: 1, out: 1 },
  ],
};

const not16Exercise = {
  inputs: ['in'],
  outputs: ['out'],
  widths: { in: 16, out: 16 },
  truthTable: [
    { in: 0xAAAA, out: 0x5555 },
    { in: 0x0000, out: 0xFFFF },
    { in: 0x1234, out: 0xEDCB },
  ],
};

const mux16Exercise = {
  inputs: ['a', 'b', 'sel'],
  outputs: ['out'],
  widths: { a: 16, b: 16, out: 16 },
  truthTable: [
    { a: 0xAAAA, b: 0x5555, sel: 0, out: 0xAAAA },
    { a: 0xAAAA, b: 0x5555, sel: 1, out: 0x5555 },
    { a: 0x1234, b: 0x5678, sel: 0, out: 0x1234 },
    { a: 0x1234, b: 0x5678, sel: 1, out: 0x5678 },
  ],
};

describe('diagnoseFailure', () => {
  it('detects a single-bit output stuck at 0', () => {
    const userOutputs = [{ out: 0 }, { out: 0 }];
    expect(diagnoseFailure(notExercise, userOutputs)).toMatch(/always 0/);
  });

  it('detects a single-bit output stuck at 1', () => {
    const userOutputs = [{ out: 1 }, { out: 1 }];
    expect(diagnoseFailure(notExercise, userOutputs)).toMatch(/always 1/);
  });

  it('detects a multi-bit output stuck at all-zeros', () => {
    const userOutputs = [{ out: 0 }, { out: 0 }, { out: 0 }];
    const msg = diagnoseFailure(not16Exercise, userOutputs);
    expect(msg).toMatch(/always 0/);
    expect(msg).toContain('out');
  });

  it('detects a multi-bit output stuck at all-ones', () => {
    const userOutputs = [{ out: 0xFFFF }, { out: 0xFFFF }, { out: 0xFFFF }];
    expect(diagnoseFailure(not16Exercise, userOutputs)).toMatch(/all-ones/);
  });

  it('detects And output wired straight to input a', () => {
    const userOutputs = [
      { out: 0 }, // a=0
      { out: 0 }, // a=0
      { out: 1 }, // a=1
      { out: 1 }, // a=1
    ];
    const msg = diagnoseFailure(andExercise, userOutputs);
    expect(msg).toContain('`out`');
    expect(msg).toContain('`a`');
    expect(msg).toMatch(/passing through/);
  });

  it('detects Mux16 wired straight to input a (ignores sel mismatch)', () => {
    const userOutputs = [
      { out: 0xAAAA },
      { out: 0xAAAA },
      { out: 0x1234 },
      { out: 0x1234 },
    ];
    const msg = diagnoseFailure(mux16Exercise, userOutputs);
    expect(msg).toContain('`a`');
  });

  it('detects bitwise inversion on a single-bit output', () => {
    // andExercise expected: 0,0,0,1 — inverted: 1,1,1,0. Make sure no input matches that pattern.
    // a = 0,0,1,1 — not match. b = 0,1,0,1 — not match. So echo-input rule will not fire.
    const userOutputs = [
      { out: 1 },
      { out: 1 },
      { out: 1 },
      { out: 0 },
    ];
    const msg = diagnoseFailure(andExercise, userOutputs);
    expect(msg).toMatch(/opposite/);
  });

  it('detects bitwise inversion on a 16-bit output', () => {
    const userOutputs = [
      { out: 0xAAAA }, // ~0x5555 & mask
      { out: 0x0000 }, // ~0xFFFF & mask
      { out: 0x1234 }, // ~0xEDCB & mask
    ];
    const msg = diagnoseFailure(not16Exercise, userOutputs);
    // For Not16, the inversion of expected equals the input itself, so the
    // echo-input rule should fire first (more specific).
    expect(msg).toContain('`in`');
    expect(msg).toMatch(/passing through/);
  });

  it('returns null when user output matches expected (no pattern)', () => {
    const userOutputs = notExercise.truthTable.map((row) => ({ out: row.out }));
    expect(diagnoseFailure(notExercise, userOutputs)).toBeNull();
  });

  it('returns null for a wrong implementation that does not fit any pattern', () => {
    // Mix of right and wrong, no constant value, not inverse, not echoing any input.
    const userOutputs = [
      { out: 0 }, // matches expected
      { out: 1 }, // wrong (expected 0)
      { out: 1 }, // wrong (expected 0)
      { out: 0 }, // wrong (expected 1)
    ];
    expect(diagnoseFailure(andExercise, userOutputs)).toBeNull();
  });

  it('does not falsely detect "stuck at 0" when the expected value is also constant 0', () => {
    const constantZeroExercise = {
      inputs: ['in'],
      outputs: ['out'],
      truthTable: [
        { in: 0, out: 0 },
        { in: 1, out: 0 },
      ],
    };
    const userOutputs = [{ out: 0 }, { out: 0 }];
    expect(diagnoseFailure(constantZeroExercise, userOutputs)).toBeNull();
  });
});
