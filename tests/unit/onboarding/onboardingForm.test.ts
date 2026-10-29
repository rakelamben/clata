import { describe, expect, it } from 'vitest';

import {
  MONTH_NAMES,
  MONTH_SHORT_NAMES,
  formatBirthDate,
  formatPackageLabel,
} from '../../../src/features/onboarding/presentation/onboardingForm';

describe('onboarding form helpers', () => {
  it('formats a local birth date with Indonesian month names', () => {
    expect(formatBirthDate(new Date(1990, 7, 17))).toBe('17 Agustus 1990');
    expect(formatBirthDate(new Date(2000, 0, 1))).toBe('1 Januari 2000');
  });

  it('keeps full and short month labels aligned', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_SHORT_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[7]).toBe('Agustus');
    expect(MONTH_SHORT_NAMES[7]).toBe('Agu');
  });

  it('turns package ids into human-readable labels', () => {
    expect(formatPackageLabel('jv', 'mataraman')).toBe('Jawa · Mataraman');
    expect(formatPackageLabel('su', 'priangan')).toBe('Su · Priangan');
  });
});
