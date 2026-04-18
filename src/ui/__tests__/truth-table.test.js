import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { formatValue, defaultFormatFor, hasMultiBitPin, STORAGE_KEY } from '../format-value.js';
import { renderSpecTable, renderComparisonTable } from '../truth-table.js';

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
  }
  add(c) {
    const classes = this.owner.className.split(/\s+/).filter(Boolean);
    if (!classes.includes(c)) classes.push(c);
    this.owner.className = classes.join(' ');
  }
  remove(c) {
    this.owner.className = this.owner.className
      .split(/\s+/)
      .filter((x) => x && x !== c)
      .join(' ');
  }
  toggle(c, on) {
    if (on) this.add(c);
    else this.remove(c);
  }
  contains(c) {
    return this.owner.className.split(/\s+/).includes(c);
  }
}

class FakeElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.className = '';
    this.textContent = '';
    this.type = '';
    this.dataset = {};
    this.classList = new FakeClassList(this);
    this._listeners = {};
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  addEventListener(event, fn) {
    (this._listeners[event] = this._listeners[event] || []).push(fn);
  }
  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }
  querySelectorAll(selector) {
    const out = [];
    walk(this, (el) => {
      if (matches(el, selector)) out.push(el);
    });
    return out;
  }
  click() {
    for (const fn of this._listeners.click || []) fn();
  }
}

function walk(el, fn) {
  for (const c of el.children) {
    fn(c);
    walk(c, fn);
  }
}

function matches(el, selector) {
  if (selector.startsWith('.')) {
    return el.className.split(/\s+/).includes(selector.slice(1));
  }
  // Attribute selector like td[data-pin]
  const attrMatch = selector.match(/^([a-z]+)\[data-([a-z0-9-]+)\]$/i);
  if (attrMatch) {
    const [, tag, attr] = attrMatch;
    const key = attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return el.tagName === tag.toUpperCase() && el.dataset[key] !== undefined;
  }
  return el.tagName === selector.toUpperCase();
}

class FakeDocument {
  constructor() {
    this._listeners = {};
  }
  createElement(tag) {
    return new FakeElement(tag);
  }
  addEventListener(event, fn) {
    (this._listeners[event] = this._listeners[event] || []).push(fn);
  }
  removeEventListener(event, fn) {
    const arr = this._listeners[event];
    if (!arr) return;
    const idx = arr.indexOf(fn);
    if (idx >= 0) arr.splice(idx, 1);
  }
  dispatchEvent(evt) {
    for (const fn of this._listeners[evt.type] || []) fn(evt);
    return true;
  }
}

class FakeStorage {
  constructor() { this.data = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.data, k) ? this.data[k] : null; }
  setItem(k, v) { this.data[k] = String(v); }
  removeItem(k) { delete this.data[k]; }
  clear() { this.data = {}; }
}

let originalDocument;
let originalStorage;
let originalCustomEvent;

beforeEach(() => {
  originalDocument = globalThis.document;
  originalStorage = globalThis.localStorage;
  originalCustomEvent = globalThis.CustomEvent;
  globalThis.document = new FakeDocument();
  globalThis.localStorage = new FakeStorage();
  globalThis.CustomEvent = class {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
});
afterEach(() => {
  globalThis.document = originalDocument;
  globalThis.localStorage = originalStorage;
  globalThis.CustomEvent = originalCustomEvent;
});

describe('formatValue', () => {
  it('formats 16-bit values as hex with 0x prefix and padding', () => {
    expect(formatValue(0xAAAA, 16, 'hex')).toBe('0xAAAA');
    expect(formatValue(0x0001, 16, 'hex')).toBe('0x0001');
    expect(formatValue(0xFFFF, 16, 'hex')).toBe('0xFFFF');
  });

  it('formats 16-bit values as binary, grouped in nibbles', () => {
    expect(formatValue(0xAAAA, 16, 'bin')).toBe('1010_1010_1010_1010');
    expect(formatValue(0x0000, 16, 'bin')).toBe('0000_0000_0000_0000');
    expect(formatValue(0x0001, 16, 'bin')).toBe('0000_0000_0000_0001');
  });

  it('pads hex to the right number of digits for the width', () => {
    expect(formatValue(5, 8, 'hex')).toBe('0x05');
    expect(formatValue(0xA, 4, 'hex')).toBe('0xA');
  });

  it('formats 8-bit binary grouped in nibbles', () => {
    expect(formatValue(0xAA, 8, 'bin')).toBe('1010_1010');
    expect(formatValue(0x01, 8, 'bin')).toBe('0000_0001');
  });

  it('always renders single-bit values as plain 0/1 regardless of format', () => {
    expect(formatValue(0, 1, 'dec')).toBe('0');
    expect(formatValue(1, 1, 'hex')).toBe('1');
    expect(formatValue(1, 1, 'bin')).toBe('1');
  });

  it('returns decimal as plain number', () => {
    expect(formatValue(43690, 16, 'dec')).toBe('43690');
  });
});

describe('defaultFormatFor', () => {
  it('returns dec for purely single-bit exercises', () => {
    const ex = { inputs: ['a', 'b'], outputs: ['out'] };
    expect(defaultFormatFor(ex)).toBe('dec');
  });

  it('respects an exercise-level override', () => {
    const ex = { widths: { in: 16 }, defaultFormat: 'bin' };
    expect(defaultFormatFor(ex)).toBe('bin');
  });

  it('falls through to hex when widths contain a multi-bit pin and no override', () => {
    const ex = { widths: { a: 16, b: 16, out: 16 } };
    expect(defaultFormatFor(ex)).toBe('hex');
  });

  it('ignores an invalid override', () => {
    const ex = { widths: { in: 16 }, defaultFormat: 'octal' };
    expect(defaultFormatFor(ex)).toBe('hex');
  });
});

describe('hasMultiBitPin', () => {
  it('is false when no widths present', () => {
    expect(hasMultiBitPin({ inputs: ['a'], outputs: ['out'] })).toBe(false);
  });

  it('is true when any pin has width > 1', () => {
    expect(hasMultiBitPin({ widths: { sel: 2 } })).toBe(true);
  });

  it('is false when all declared widths are 1', () => {
    expect(hasMultiBitPin({ widths: { a: 1, b: 1 } })).toBe(false);
  });
});

const singleBitExercise = {
  id: 'and',
  name: 'And',
  inputs: ['a', 'b'],
  outputs: ['out'],
  truthTable: [
    { a: 0, b: 0, out: 0 },
    { a: 1, b: 1, out: 1 },
  ],
};

const not16Exercise = {
  id: 'not16',
  name: 'Not16',
  inputs: ['in'],
  outputs: ['out'],
  widths: { in: 16, out: 16 },
  defaultFormat: 'bin',
  truthTable: [
    { in: 0xAAAA, out: 0x5555 },
    { in: 0x0000, out: 0xFFFF },
  ],
};

const mux16Exercise = {
  id: 'mux16',
  name: 'Mux16',
  inputs: ['a', 'b', 'sel'],
  outputs: ['out'],
  widths: { a: 16, b: 16, out: 16 },
  truthTable: [
    { a: 0xAAAA, b: 0x5555, sel: 0, out: 0xAAAA },
    { a: 0xAAAA, b: 0x5555, sel: 1, out: 0x5555 },
  ],
};

describe('renderSpecTable', () => {
  it('renders binary by default on Not16 and does not include a leading 0x', () => {
    const wrapper = renderSpecTable(not16Exercise);
    const cells = wrapper.querySelectorAll('td[data-pin]');
    const texts = cells.map((c) => c.textContent);
    expect(texts).toContain('1010_1010_1010_1010');
    expect(texts).toContain('0101_0101_0101_0101');
  });

  it('renders hex by default on Mux16 (no exercise override)', () => {
    const wrapper = renderSpecTable(mux16Exercise);
    const cells = wrapper.querySelectorAll('td[data-pin]');
    const texts = cells.map((c) => c.textContent);
    expect(texts).toContain('0xAAAA');
    expect(texts).toContain('0x5555');
  });

  it('single-bit sel pin renders as plain 0/1 even inside a multi-bit exercise', () => {
    const wrapper = renderSpecTable(mux16Exercise);
    const selCells = wrapper.querySelectorAll('td[data-pin]').filter((c) => c.dataset.pin === 'sel');
    expect(selCells.map((c) => c.textContent).sort()).toEqual(['0', '1']);
  });

  it('does not render a format toggle for purely single-bit exercises', () => {
    const wrapper = renderSpecTable(singleBitExercise);
    expect(wrapper.querySelector('.format-toggle')).toBeNull();
  });

  it('renders a format toggle when any pin is multi-bit', () => {
    const wrapper = renderSpecTable(not16Exercise);
    const toggle = wrapper.querySelector('.format-toggle');
    expect(toggle).not.toBeNull();
    const btns = toggle.querySelectorAll('.format-toggle-btn');
    expect(btns.map((b) => b.textContent).sort()).toEqual(['bin', 'dec', 'hex']);
  });

  it('marks the default format button as active', () => {
    const wrapper = renderSpecTable(not16Exercise);
    const btns = wrapper.querySelectorAll('.format-toggle-btn');
    const active = btns.find((b) => b.classList.contains('active'));
    expect(active.textContent).toBe('bin');
  });

  it('respects a stored format preference over the per-exercise default', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'hex');
    const wrapper = renderSpecTable(not16Exercise);
    const cells = wrapper.querySelectorAll('td[data-pin]');
    expect(cells.map((c) => c.textContent)).toContain('0xAAAA');
  });

  it('clicking the hex button switches every value cell to hex in place', () => {
    const wrapper = renderSpecTable(not16Exercise);
    const hexBtn = wrapper.querySelectorAll('.format-toggle-btn').find((b) => b.textContent === 'hex');
    hexBtn.click();
    const cells = wrapper.querySelectorAll('td[data-pin]');
    const texts = cells.map((c) => c.textContent);
    expect(texts).toContain('0xAAAA');
    expect(texts).toContain('0x5555');
    // binary rendering is gone
    expect(texts.some((t) => t.includes('_'))).toBe(false);
  });
});

describe('renderComparisonTable', () => {
  const userOutputs = [
    { out: 0x5555 },
    { out: 0x1234 },
  ];

  it('preserves match/mismatch classes while reformatting values', () => {
    const wrapper = renderComparisonTable(not16Exercise, userOutputs);
    const matchCells = wrapper.querySelectorAll('.match');
    const mismatchCells = wrapper.querySelectorAll('.mismatch');
    expect(matchCells.length).toBe(1);
    expect(mismatchCells.length).toBe(1);
    // The mismatched user cell shows the user's value, formatted in the default (bin)
    expect(mismatchCells[0].textContent).toBe('0001_0010_0011_0100');
  });

  it('toggle also updates comparison table cells', () => {
    const wrapper = renderComparisonTable(not16Exercise, userOutputs);
    const decBtn = wrapper.querySelectorAll('.format-toggle-btn').find((b) => b.textContent === 'dec');
    decBtn.click();
    const mismatch = wrapper.querySelector('.mismatch');
    expect(mismatch.textContent).toBe('4660');
  });
});
