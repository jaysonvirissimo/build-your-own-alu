import { describe, it, expect } from 'vitest';
import {
  PRIMITIVE_TOOLTIPS,
  getChipTooltip,
  chipNameFromCellId,
} from '../chip-tooltips.js';

describe('chipNameFromCellId', () => {
  it('extracts a primitive name from a netlistsvg cell id', () => {
    expect(chipNameFromCellId('cell_Nand$0')).toBe('Nand');
    expect(chipNameFromCellId('cell_And$12')).toBe('And');
    expect(chipNameFromCellId('cell_Mux$0')).toBe('Mux');
  });

  it('handles user-defined chip names with no $ suffix', () => {
    expect(chipNameFromCellId('cell_And16$3')).toBe('And16');
  });

  it('returns null for ids that do not match the netlistsvg cell pattern', () => {
    expect(chipNameFromCellId('not_a_cell_id')).toBeNull();
    expect(chipNameFromCellId('')).toBeNull();
    expect(chipNameFromCellId(null)).toBeNull();
  });
});

describe('getChipTooltip', () => {
  it('returns a non-empty tooltip for every primitive', () => {
    for (const name of Object.keys(PRIMITIVE_TOOLTIPS)) {
      const tip = getChipTooltip(name);
      expect(typeof tip).toBe('string');
      expect(tip.length).toBeGreaterThan(0);
    }
  });

  it('returns null for unknown chip names', () => {
    expect(getChipTooltip('Or8Way')).toBeNull();
    expect(getChipTooltip('SomeUserChip')).toBeNull();
  });
});

describe('tooltip table stays in sync with PRIMITIVE_MAP', () => {
  it('every tooltip key is a known schematic primitive', async () => {
    const { PRIMITIVE_MAP } = await import('../netlist-converter.js');
    for (const name of Object.keys(PRIMITIVE_TOOLTIPS)) {
      expect(PRIMITIVE_MAP).toHaveProperty(name);
    }
  });
});
