import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ParseError, SimError, ValidationError } from '../../hdl/errors.js';
import { renderErrorPanel } from '../error-panel.js';

class FakeElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.className = '';
    this.textContent = '';
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  get innerText() {
    return collectText(this);
  }
  querySelector(selector) {
    return findDescendant(this, selector);
  }
  querySelectorAll(selector) {
    return findAllDescendants(this, selector);
  }
}

function collectText(el) {
  let out = el.textContent || '';
  for (const c of el.children) out += collectText(c);
  return out;
}

function findDescendant(el, selector) {
  for (const c of el.children) {
    if (matches(c, selector)) return c;
    const inner = findDescendant(c, selector);
    if (inner) return inner;
  }
  return null;
}

function findAllDescendants(el, selector) {
  const out = [];
  for (const c of el.children) {
    if (matches(c, selector)) out.push(c);
    out.push(...findAllDescendants(c, selector));
  }
  return out;
}

function matches(el, selector) {
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    return el.className.split(/\s+/).includes(cls);
  }
  return el.tagName === selector.toUpperCase();
}

let originalDocument;
beforeEach(() => {
  originalDocument = globalThis.document;
  globalThis.document = {
    createElement: (tag) => new FakeElement(tag),
  };
});
afterEach(() => {
  globalThis.document = originalDocument;
});

describe('renderErrorPanel', () => {
  it('labels a ParseError as "Parser error" and shows location', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 2, col 5: Expected ';'", { line: 2, col: 5 });
    renderErrorPanel(container, err, null);

    const panel = container.querySelector('.error-panel');
    expect(panel).not.toBeNull();
    expect(panel.className).toContain('error-panel--parser');
    expect(panel.querySelector('.error-panel__badge').textContent).toBe('Parser error');
    expect(panel.querySelector('.error-panel__location').textContent).toBe('Line 2');
  });

  it('includes a suggestion for missing semicolon', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 1, col 10: Expected ';' after ...", { line: 1, col: 10 });
    renderErrorPanel(container, err, null);

    const suggestion = container.querySelector('.error-panel__suggestion');
    expect(suggestion).not.toBeNull();
    expect(suggestion.textContent).toMatch(/semicolon/i);
  });

  it('suggests an `=` between sub-pin and wire', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 3, col 12: Expected '=' between sub-pin and wire, got an identifier 'in'", { line: 3, col: 12 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/pinName=wireName/);
  });

  it('suggests opening paren after chip name', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 4, col 8: Expected '(' after chip name 'Nand', got an identifier 'a'", { line: 4, col: 8 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/Nand\(a=x, b=y, out=z\)/);
  });

  it('suggests a sub-pin name on the left of `=`', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 5, col 10: Expected an identifier as sub-pin name, got '='", { line: 5, col: 10 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/sub-pin name on the left of `=`/);
  });

  it('suggests a wire name on the right of `=`', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 5, col 14: Expected an identifier as wire name, got ','", { line: 5, col: 14 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/wire name/);
  });

  it('suggests bracket syntax for bus slots', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 6, col 4: Expected ']' after bus index, got ','", { line: 6, col: 4 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/a\[3\]/);
    expect(s.textContent).toMatch(/a\[0\.\.7\]/);
  });

  it('suggests double-dot for bus ranges', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 7, col 6: Unexpected character '.'. Did you mean '..'?", { line: 7, col: 6 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/two dots/);
  });

  it('suggests closing a block comment', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 1, col 1: Unterminated block comment", { line: 1, col: 1 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/\*\//);
  });

  it('suggests starting the file with `CHIP`', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 1, col 1: Expected 'CHIP' , got 'chip'", { line: 1, col: 1 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/CHIP/);
  });

  it('suggests the IN/OUT/PARTS order', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 2, col 3: Expected 'IN' , got 'OUT'", { line: 2, col: 3 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/IN.*OUT.*PARTS/);
  });

  it('suggests adding closing `}` when input ends mid-chip', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 1, col 31: Expected an identifier as chip name, got end of input ''", { line: 1, col: 31 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/closing `}`/);
  });

  it('suggests removing stray text after the closing `}`', () => {
    const container = new FakeElement('div');
    const err = new ParseError("Line 9, col 1: Unexpected content after chip definition: 'extra'", { line: 9, col: 1 });
    renderErrorPanel(container, err, null);
    const s = container.querySelector('.error-panel__suggestion');
    expect(s.textContent).toMatch(/closing/);
  });

  it('categorizes SimError chip-missing as "Chip error"', () => {
    const container = new FakeElement('div');
    const err = new SimError("Chip 'Or' is not available. Available chips: Nand", {
      line: 5,
      col: 3,
      kind: 'chip-missing',
    });
    renderErrorPanel(container, err, null);

    const panel = container.querySelector('.error-panel');
    expect(panel.className).toContain('error-panel--chip');
    expect(panel.querySelector('.error-panel__badge').textContent).toBe('Chip error');
    expect(panel.querySelector('.error-panel__suggestion').textContent).toMatch(/case-sensitive/i);
  });

  it('categorizes SimError output-unassigned with no location', () => {
    const container = new FakeElement('div');
    const err = new SimError("Output 'out' was never assigned in chip 'Not'", {
      kind: 'output-unassigned',
    });
    renderErrorPanel(container, err, null);

    const panel = container.querySelector('.error-panel');
    expect(panel.className).toContain('error-panel--sim');
    expect(panel.querySelector('.error-panel__badge').textContent).toBe('Simulation error');
    expect(panel.querySelector('.error-panel__location')).toBeNull();
    expect(panel.querySelector('.error-panel__suggestion').textContent).toMatch(/Output 'out'/);
    expect(panel.querySelector('.error-panel__suggestion').textContent).toMatch(/each output/i);
  });

  it('categorizes plain "Expected CHIP" message as "Chip error"', () => {
    const container = new FakeElement('div');
    const err = new Error('Expected CHIP Not, but found CHIP Nand');
    renderErrorPanel(container, err, null);

    const panel = container.querySelector('.error-panel');
    expect(panel.className).toContain('error-panel--chip');
    expect(panel.querySelector('.error-panel__badge').textContent).toBe('Chip error');
  });

  it('calls editorApi.highlightError with the line when present', () => {
    const container = new FakeElement('div');
    const err = new ParseError('Line 7, col 1: Unexpected character \'@\'', { line: 7, col: 1 });
    let receivedLine = 'untouched';
    const editorApi = { highlightError: (n) => { receivedLine = n; } };
    renderErrorPanel(container, err, editorApi);
    expect(receivedLine).toBe(7);
  });

  it('calls editorApi.highlightError with null when line is missing', () => {
    const container = new FakeElement('div');
    const err = new SimError("Output 'out' was never assigned in chip 'Not'", {
      kind: 'output-unassigned',
    });
    let receivedLine = 'untouched';
    const editorApi = { highlightError: (n) => { receivedLine = n; } };
    renderErrorPanel(container, err, editorApi);
    expect(receivedLine).toBeNull();
  });

  it('categorizes ValidationError as "Validation error"', () => {
    const container = new FakeElement('div');
    const err = new ValidationError("Chip 'Nand' has no pin named 'c'.", { line: 5, col: 3, kind: 'unknown-sub-pin' });
    renderErrorPanel(container, err, null);
    const panel = container.querySelector('.error-panel');
    expect(panel.className).toContain('error-panel--validation');
    expect(panel.querySelector('.error-panel__badge').textContent).toBe('Validation error');
  });

  it('suggests checking pin uniqueness for duplicate-pin', () => {
    const container = new FakeElement('div');
    renderErrorPanel(container, new ValidationError('Pin x is declared more than once', { kind: 'duplicate-pin' }), null);
    expect(container.querySelector('.error-panel__suggestion').textContent).toMatch(/unique within a chip/i);
  });

  it('suggests low-to-high ranges for bad-pin-width', () => {
    const container = new FakeElement('div');
    renderErrorPanel(container, new ValidationError('Pin x has width 0', { kind: 'bad-pin-width' }), null);
    expect(container.querySelector('.error-panel__suggestion').textContent).toMatch(/low-to-high/);
  });

  it('suggests checking sub-pin spelling for unknown-sub-pin', () => {
    const container = new FakeElement('div');
    renderErrorPanel(container, new ValidationError("no pin named 'c'", { kind: 'unknown-sub-pin' }), null);
    expect(container.querySelector('.error-panel__suggestion').textContent).toMatch(/case-sensitive/);
  });

  it('suggests wiring every input for missing-sub-input', () => {
    const container = new FakeElement('div');
    renderErrorPanel(container, new ValidationError("'b' is not connected", { kind: 'missing-sub-input' }), null);
    expect(container.querySelector('.error-panel__suggestion').textContent).toMatch(/Every input pin/i);
  });

  it('suggests one connection per bit for duplicate-sub-connection', () => {
    const container = new FakeElement('div');
    renderErrorPanel(container, new ValidationError("'a' is wired more than once", { kind: 'duplicate-sub-connection' }), null);
    expect(container.querySelector('.error-panel__suggestion').textContent).toMatch(/only be wired once/);
  });

  it('suggests low-to-high ranges for reversed-bus-range', () => {
    const container = new FakeElement('div');
    renderErrorPanel(container, new ValidationError('range [3..0] is reversed', { kind: 'reversed-bus-range' }), null);
    expect(container.querySelector('.error-panel__suggestion').textContent).toMatch(/low-to-high/);
  });

  it('suggests checking bit width for out-of-bounds-bus', () => {
    const container = new FakeElement('div');
    renderErrorPanel(container, new ValidationError('Bit 8 is out of bounds', { kind: 'out-of-bounds-bus' }), null);
    expect(container.querySelector('.error-panel__suggestion').textContent).toMatch(/0 through 7/);
  });

  it('preserves raw message under a <details> block', () => {
    const container = new FakeElement('div');
    const raw = "Line 3, col 8: Expected ';' after part 'Nand'";
    const err = new ParseError(raw, { line: 3, col: 8 });
    renderErrorPanel(container, err, null);

    const details = container.querySelector('.error-panel__raw');
    expect(details).not.toBeNull();
    expect(details.tagName).toBe('DETAILS');
    const pre = details.querySelector('PRE');
    expect(pre.textContent).toBe(raw);
  });
});
