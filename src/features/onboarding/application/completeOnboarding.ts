import type { LocalProfileRepository } from '../data/localProfileRepository';

export async function completeOnboarding(profileRepository: LocalProfileRepository, packageId: string): Promise<void> {
  const profile = await profileRepository.getProfile();
  if (profile.birthYear === null || profile.ageCategory === 'blocked') throw new Error('Profil lokal belum memenuhi syarat.');
  await profileRepository.completeOnboarding(profile.birthYear, packageId);
}
