import { describe, it, expect } from 'vitest';
import { EXERCISES } from '../definitions.js';

describe('EXERCISES definitions', () => {
  it('has no duplicate IDs', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate names', () => {
    const names = EXERCISES.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  EXERCISES.forEach((exercise) => {
    describe(exercise.name, () => {
      it('has all required fields', () => {
        expect(exercise.id).toBeTypeOf('string');
        expect(exercise.name).toBeTypeOf('string');
        expect(exercise.chapter).toBeTypeOf('number');
        expect(exercise.inputs).toBeInstanceOf(Array);
        expect(exercise.outputs).toBeInstanceOf(Array);
        expect(exercise.skeleton).toBeTypeOf('string');
        expect(exercise.truthTable).toBeInstanceOf(Array);
        expect(exercise.truthTable.length).toBeGreaterThan(0);
      });

      it('has truth table columns matching inputs + outputs', () => {
        const expectedKeys = [...exercise.inputs, ...exercise.outputs].sort();
        for (const row of exercise.truthTable) {
          const rowKeys = Object.keys(row).sort();
          expect(rowKeys).toEqual(expectedKeys);
        }
      });

      it('has skeleton containing the chip name', () => {
        expect(exercise.skeleton).toContain(`CHIP ${exercise.name}`);
      });

      it('has truth table values that are non-negative integers', () => {
        for (const row of exercise.truthTable) {
          for (const val of Object.values(row)) {
            expect(Number.isInteger(val) && val >= 0).toBe(true);
          }
        }
      });
    });
  });
});
