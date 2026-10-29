import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { ChallengeCardItem, ChallengeVariantType } from './challengeTypes';

export interface ChallengeRepository {
  getChallenges(packageId: string, unitId?: string, level?: string): Promise<RepositoryResult<ChallengeCardItem[]>>;
  toggleChallengeCheck(input: {
    packageId: string;
    challengeId: string;
    variant: ChallengeVariantType;
  }): Promise<RepositoryResult<{ isChecked: boolean }>>;
}
