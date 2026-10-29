import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { ChallengeRepository } from '../domain/challengeRepository';
import type { ChallengeCardItem } from '../domain/challengeTypes';

export async function getChallenges(
  repository: ChallengeRepository,
  packageId: string,
  unitId?: string,
  level?: string,
): Promise<RepositoryResult<ChallengeCardItem[]>> {
  return repository.getChallenges(packageId, unitId, level);
}
