import { describe, expect, it } from 'vitest';
import { updateStrength } from '../../../src/domain/progress/strength';

describe('strength', () => {
  it('applies curated answer formula and clamps range', () => {
    expect(updateStrength(0.1, 1, 1)).toBeCloseTo(0.37);
    expect(updateStrength(1, 1, 1)).toBe(1);
    expect(updateStrength(0, 0, 1)).toBe(0);
  });
});
