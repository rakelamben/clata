import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { PracticeRepository } from '../domain/practiceTypes';

export function submitPracticeAnswer(repository: PracticeRepository, input: { sessionId: string; questionId: string; optionId: string }): Promise<RepositoryResult<{ correct: boolean; correctOptionId: string; answerLabel: string; nextIndex: number; sessionCompleted: boolean }>> { return repository.submitAnswer(input); }
