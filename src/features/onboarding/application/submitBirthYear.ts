import type { Clock } from '../../../domain/ports/Clock';
import { getAgeCategory, validateBirthYear } from '../../../domain/onboarding/ageGate';
import type { LocalProfileRepository } from '../data/localProfileRepository';

export async function submitBirthYear(profileRepository: LocalProfileRepository, birthYear: number, clock: Clock): Promise<'blocked' | 'accepted'> {
  const invalid = validateBirthYear(birthYear, clock.now());
  if (invalid) throw new Error(invalid);
  const category = getAgeCategory(birthYear, clock);
  await profileRepository.saveBirthYear(birthYear);
  return category === 'blocked' ? 'blocked' : 'accepted';
}
