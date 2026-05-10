import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadProgress, saveExercise, clearProgress, clearProgressFrom } from '../progress.js';

class FakeStorage {
  constructor() { this.data = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.data, k) ? this.data[k] : null; }
  setItem(k, v) { this.data[k] = String(v); }
  removeItem(k) { delete this.data[k]; }
  clear() { this.data = {}; }
}

let originalStorage;

beforeEach(() => {
  originalStorage = globalThis.localStorage;
  globalThis.localStorage = new FakeStorage();
});

afterEach(() => {
  globalThis.localStorage = originalStorage;
});

const exercises = [
  { id: 'not', name: 'Not' },
  { id: 'and', name: 'And' },
  { id: 'or',  name: 'Or' },
  { id: 'xor', name: 'Xor' },
];

describe('saveExercise / loadProgress round-trip', () => {
  it('persists code and solved state', () => {
    saveExercise('not', 'CHIP Not { ... }', true);
    const p = loadProgress();
    expect(p.get('not')).toEqual({ code: 'CHIP Not { ... }', solved: true });
  });

  it('overwrites prior entries for the same id', () => {
    saveExercise('not', 'first', false);
    saveExercise('not', 'second', true);
    expect(loadProgress().get('not')).toEqual({ code: 'second', solved: true });
  });

  it('clearProgress removes all entries', () => {
    saveExercise('not', 'x', true);
    clearProgress();
    expect(loadProgress().size).toBe(0);
  });
});

describe('clearProgressFrom', () => {
  beforeEach(() => {
    saveExercise('not', 'a', true);
    saveExercise('and', 'b', true);
    saveExercise('or',  'c', true);
    saveExercise('xor', 'd', false);
  });

  it('clears the given id and every later id', () => {
    const next = clearProgressFrom('and', exercises);
    expect(next.has('not')).toBe(true);
    expect(next.has('and')).toBe(false);
    expect(next.has('or')).toBe(false);
    expect(next.has('xor')).toBe(false);
    // Persisted to storage too
    expect(loadProgress().has('or')).toBe(false);
  });

  it('clears only the last id when called on the last exercise', () => {
    const next = clearProgressFrom('xor', exercises);
    expect(next.has('not')).toBe(true);
    expect(next.has('and')).toBe(true);
    expect(next.has('or')).toBe(true);
    expect(next.has('xor')).toBe(false);
  });

  it('is a no-op for an unknown id', () => {
    const before = loadProgress();
    const next = clearProgressFrom('nonexistent', exercises);
    expect([...next.keys()].sort()).toEqual([...before.keys()].sort());
    expect(loadProgress().has('xor')).toBe(true); // unchanged
  });
});
