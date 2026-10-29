import type { Clock } from '../../../domain/ports/Clock';
import { getAgeCategory } from '../../../domain/onboarding/ageGate';
import type { OnboardingState } from '../../../domain/onboarding/onboardingTypes';
import type { LocalProfileRepository } from '../data/localProfileRepository';
import type { PackageRepository } from '../../packages/data/packageRepository';

export async function loadOnboardingState(profileRepository: LocalProfileRepository, packageRepository: PackageRepository, clock: Clock, onboardingCompleted: boolean): Promise<OnboardingState> {
  const profile = await profileRepository.getProfile();
  if (profile.birthYear !== null && getAgeCategory(profile.birthYear, clock) === 'blocked') return 'blocked';
  if (onboardingCompleted) return profile.selectedPackageId && await packageRepository.isActive(profile.selectedPackageId) ? 'ready' : 'installing-package';
  if ((await packageRepository.listActive()).length === 0) return 'installing-package';
  if (profile.birthYear === null) return 'intro';
  if (!(await profileRepository.isLocalWarningAcknowledged())) return 'local-data-warning';
  return 'ready';
}
