import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { PracticeExerciseType, PracticeRepository } from '../domain/practiceTypes';

export function getPracticeAvailability(repository: PracticeRepository, packageId: string, exerciseType: PracticeExerciseType, unitId?: string): Promise<RepositoryResult<{ available: boolean; reason?: string; count: number }>> {
  return repository.getAvailability(packageId, exerciseType, unitId);
}
