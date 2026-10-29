import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { PracticeRepository } from '../domain/practiceTypes';

export function completePracticeSession(repository: PracticeRepository, sessionId: string): Promise<RepositoryResult<void>> { return repository.completeSession(sessionId); }
