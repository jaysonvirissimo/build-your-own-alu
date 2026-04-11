import { describe, it, expect } from 'vitest';
import { ChipRegistry } from '../chips.js';

describe('ChipRegistry', () => {
  it('starts with Nand registered', () => {
    const registry = new ChipRegistry();
    expect(registry.has('Nand')).toBe(true);
  });

  it('does not have unregistered chips', () => {
    const registry = new ChipRegistry();
    expect(registry.has('Not')).toBe(false);
    expect(registry.get('Not')).toBeUndefined();
  });

  it('returns the Nand definition', () => {
    const registry = new ChipRegistry();
    const nand = registry.get('Nand');
    expect(nand.name).toBe('Nand');
    expect(nand.builtin).toBe(true);
    expect(nand.inputs).toHaveLength(2);
    expect(nand.outputs).toHaveLength(1);
  });

  it('evaluates Nand correctly for all input combinations', () => {
    const registry = new ChipRegistry();
    const nand = registry.get('Nand');
    expect(nand.evaluate({ a: 0, b: 0 })).toEqual({ out: 1 });
    expect(nand.evaluate({ a: 0, b: 1 })).toEqual({ out: 1 });
    expect(nand.evaluate({ a: 1, b: 0 })).toEqual({ out: 1 });
    expect(nand.evaluate({ a: 1, b: 1 })).toEqual({ out: 0 });
  });

  it('registers and retrieves a user-defined chip', () => {
    const registry = new ChipRegistry();
    const fakeDef = { name: 'Not', inputs: [], outputs: [], parts: [] };
    registry.register('Not', fakeDef);
    expect(registry.has('Not')).toBe(true);
    expect(registry.get('Not')).toBe(fakeDef);
  });

  it('returns all available names', () => {
    const registry = new ChipRegistry();
    expect(registry.getAvailableNames()).toEqual(['Nand']);
    registry.register('Not', { name: 'Not' });
    expect(registry.getAvailableNames()).toEqual(['Nand', 'Not']);
  });
});
