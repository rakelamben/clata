import { describe, expect, it } from 'vitest';

import { calculateAge, getAgeCategory, getCapabilities, validateBirthYear } from '../../../src/domain/onboarding/ageGate';

describe('age gate', () => {
  const now = new Date('2026-10-29T12:00:00.000Z');

  it('uses calendar-year boundaries', () => {
    expect(calculateAge(2016, now)).toBe(10);
    expect(getAgeCategory(2016, now)).toBe('minor');
    expect(getAgeCategory(2008, now)).toBe('adult');
    expect(getAgeCategory(2017, now)).toBe('blocked');
  });

  it('rejects impossible years', () => {
    expect(validateBirthYear(2027, now)).toBeTruthy();
    expect(validateBirthYear(1900, now)).toBeTruthy();
    expect(validateBirthYear(2000, now)).toBeNull();
  });

  it('limits capabilities for minors', () => {
    expect([...getCapabilities('minor')]).toEqual(['p0']);
    expect(getCapabilities('minor').has('sync')).toBe(false);
    expect(getCapabilities('adult').has('sync')).toBe(true);
  });
});
