import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { PracticeQuestion, PracticeRepository } from '../domain/practiceTypes';

export function getPracticeQuestion(repository: PracticeRepository, sessionId: string, index: number): Promise<RepositoryResult<PracticeQuestion | null>> { return repository.getQuestion(sessionId, index); }
