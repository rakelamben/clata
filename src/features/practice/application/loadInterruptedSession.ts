import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { PracticeRepository, PracticeSession } from '../domain/practiceTypes';

export function loadInterruptedSession(repository: PracticeRepository, packageId: string): Promise<RepositoryResult<PracticeSession | null>> { return repository.getInterruptedSession(packageId); }
