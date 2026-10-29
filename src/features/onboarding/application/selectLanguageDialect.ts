import type { LanguageDialectOption } from '../../../domain/onboarding/onboardingTypes';
import type { LocalProfileRepository } from '../data/localProfileRepository';
import type { PackageRepository } from '../../packages/data/packageRepository';

export async function selectLanguageDialect(profileRepository: LocalProfileRepository, packageRepository: PackageRepository, packageId: string): Promise<LanguageDialectOption> {
  const option = (await packageRepository.listActive()).find((candidate) => candidate.packageId === packageId);
  if (!option) throw new Error('Paket bahasa belum terpasang.');
  await profileRepository.setSelectedPackage(packageId);
  return option;
}
