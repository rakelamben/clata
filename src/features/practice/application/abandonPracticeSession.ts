import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { PracticeRepository } from '../domain/practiceTypes';

export function abandonPracticeSession(repository: PracticeRepository, sessionId: string): Promise<RepositoryResult<void>> { return repository.abandonSession(sessionId); }
