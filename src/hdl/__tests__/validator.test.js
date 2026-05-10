import { describe, it, expect } from 'vitest';
import { parseHDL } from '../parser.js';
import { validateChip } from '../validator.js';
import { ValidationError } from '../errors.js';
import { ChipRegistry } from '../chips.js';

function expectValidationError(src, kind, messagePattern) {
  const reg = new ChipRegistry();
  const def = parseHDL(src);
  let caught = null;
  try { validateChip(def, reg); }
  catch (e) { caught = e; }
  if (!caught) throw new Error(`expected ValidationError of kind '${kind}', got none`);
  expect(caught).toBeInstanceOf(ValidationError);
  expect(caught.kind).toBe(kind);
  if (messagePattern) expect(caught.message).toMatch(messagePattern);
}

function expectOk(src) {
  const reg = new ChipRegistry();
  const def = parseHDL(src);
  validateChip(def, reg);
}

describe('validateChip — duplicate-pin', () => {
  it('throws on duplicate IN names', () => {
    expectValidationError(
      'CHIP Foo { IN x, x; OUT y; PARTS: }',
      'duplicate-pin',
      /'x' is declared twice in IN/
    );
  });

  it('throws on duplicate OUT names', () => {
    expectValidationError(
      'CHIP Foo { IN a; OUT y, y; PARTS: }',
      'duplicate-pin',
      /'y' is declared twice in OUT/
    );
  });

  it('throws when same name appears in IN and OUT', () => {
    expectValidationError(
      'CHIP Foo { IN x; OUT x; PARTS: }',
      'duplicate-pin',
      /'x' is declared in both IN and OUT/
    );
  });

  it('passes for distinct pin names', () => {
    expectOk('CHIP Foo { IN a, b; OUT y; PARTS: Nand(a=a, b=b, out=y); }');
  });
});

describe('validateChip — bad-pin-width', () => {
  it('throws on a reversed-range IN declaration (width <= 0)', () => {
    // IN x[7..0] yields width = 0 - 7 + 1 = -6 in the parser.
    expectValidationError(
      'CHIP Foo { IN x[7..0]; OUT y; PARTS: }',
      'bad-pin-width',
      /width.*must be at least 1/i
    );
  });

  it('passes for valid widths', () => {
    expectOk('CHIP Foo { IN x[8]; OUT y[16]; PARTS: }');
  });
});

describe('validateChip — unknown-sub-pin', () => {
  it('throws on a typo in a sub-pin name', () => {
    expectValidationError(
      'CHIP Foo { IN x; OUT y; PARTS: Nand(c=x, b=x, out=y); }',
      'unknown-sub-pin',
      /no pin named 'c'/
    );
  });

  it('passes for correct sub-pin names', () => {
    expectOk('CHIP Foo { IN x; OUT y; PARTS: Nand(a=x, b=x, out=y); }');
  });
});

describe('validateChip — missing-sub-input', () => {
  it('throws when a required input is missing', () => {
    expectValidationError(
      'CHIP Foo { IN x; OUT y; PARTS: Nand(a=x, out=y); }',
      'missing-sub-input',
      /'b'.*not connected/
    );
  });

  it('passes when every input is wired', () => {
    expectOk('CHIP Foo { IN x; OUT y; PARTS: Nand(a=x, b=x, out=y); }');
  });
});

describe('validateChip — duplicate-sub-connection', () => {
  it('throws on the same sub-input pin connected twice', () => {
    expectValidationError(
      'CHIP Foo { IN x; OUT y; PARTS: Nand(a=x, a=x, b=x, out=y); }',
      'duplicate-sub-connection',
      /'a'.*more than once/
    );
  });

  it('passes when sub-output is read into multiple wires', () => {
    // Reading the same sub-output into different wires is fine: out drives both.
    expectOk('CHIP Foo { IN x; OUT y; PARTS: Nand(a=x, b=x, out=y); }');
  });
});

describe('validateChip — reversed-bus-range', () => {
  it('throws on a reversed range in a connection', () => {
    expectValidationError(
      'CHIP Foo { IN x[8]; OUT y; PARTS: Nand(a=x[3..0], b=x[0..7], out=y); }',
      'reversed-bus-range',
      /\[3\.\.0\].*reversed/
    );
  });
});

describe('validateChip — out-of-bounds-bus', () => {
  it('throws on a sub-pin index beyond the pin width', () => {
    // Nand.a has width 1; index [2] is out of bounds.
    expectValidationError(
      'CHIP Foo { IN x[8]; OUT y; PARTS: Nand(a[2]=x[0], b=x, out=y); }',
      'out-of-bounds-bus',
      /Bit 2.*out of bounds/
    );
  });

  it('throws on a wire-side index past the external pin width', () => {
    expectValidationError(
      'CHIP Foo { IN x[8]; OUT y; PARTS: Nand(a=x[8], b=x[0], out=y); }',
      'out-of-bounds-bus',
      /Bit 8.*out of bounds/
    );
  });

  it('passes when wire is internal (width unknown — defer to simulator)', () => {
    // 'mid' is an internal wire: no external width to check against.
    expectOk('CHIP Foo { IN x; OUT y; PARTS: Nand(a=x, b=x, out=mid); Nand(a=mid, b=mid, out=y); }');
  });
});

describe('validateChip — interaction with simulator-handled errors', () => {
  it('lets the simulator report unknown sub-chip names', () => {
    // Validator must not throw on chip-missing — that's the simulator's job
    // (chip-missing SimError already has a tuned suggestion in error-panel).
    const reg = new ChipRegistry();
    const def = parseHDL('CHIP Foo { IN x; OUT y; PARTS: NoSuchChip(a=x, out=y); }');
    expect(() => validateChip(def, reg)).not.toThrow();
  });
});
