import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ParseError, SimError } from '../../hdl/errors.js';
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
    expect(panel.querySelector('.error-panel__suggestion').textContent).toMatch(/out=/);
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
