import { describe, expect, it } from 'vitest';
import { calculateCurrentStreak } from '../../../src/domain/progress/streak';

describe('streak', () => {
  it('counts consecutive days through today or yesterday', () => {
    expect(calculateCurrentStreak(['2026-01-01', '2026-01-02'], '2026-01-02')).toBe(2);
    expect(calculateCurrentStreak(['2026-01-01'], '2026-01-03')).toBe(0);
    expect(calculateCurrentStreak(['2026-01-01', '2026-01-02'], '2026-01-03')).toBe(2);
  });
});
