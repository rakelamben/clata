import type { Clock } from '../ports/Clock';
import type { AgeCapability, AgeCategory } from './onboardingTypes';

export function validateBirthYear(value: number, now: Date): string | null {
  const currentYear = now.getFullYear();
  if (!Number.isInteger(value) || value < currentYear - 120 || value > currentYear) return 'Masukkan tahun lahir yang valid.';
  return null;
}

export function calculateAge(birthYear: number, now: Date): number {
  return now.getFullYear() - birthYear;
}

export function getAgeCategory(birthYear: number, clock: Clock | Date): AgeCategory {
  const now = clock instanceof Date ? clock : clock.now();
  return calculateAge(birthYear, now) < 10 ? 'blocked' : calculateAge(birthYear, now) < 18 ? 'minor' : 'adult';
}

export function getCapabilities(category: AgeCategory): ReadonlySet<AgeCapability> {
  if (category === 'blocked') return new Set();
  if (category === 'minor') return new Set<AgeCapability>(['p0']);
  return new Set<AgeCapability>(['p0', 'account', 'sync', 'aiDialogue']);
}

export function canUseCapability(category: AgeCategory, capability: AgeCapability): boolean {
  return getCapabilities(category).has(capability);
}
