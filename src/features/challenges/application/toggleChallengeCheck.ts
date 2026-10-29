import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { ChallengeRepository } from '../domain/challengeRepository';
import type { ChallengeVariantType } from '../domain/challengeTypes';

export async function toggleChallengeCheck(input: {
  repository: ChallengeRepository;
  packageId: string;
  challengeId: string;
  variant: ChallengeVariantType;
}): Promise<RepositoryResult<{ isChecked: boolean }>> {
  const { repository, packageId, challengeId, variant } = input;
  return repository.toggleChallengeCheck({ packageId, challengeId, variant });
}
