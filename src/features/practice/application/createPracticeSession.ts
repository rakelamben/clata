import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import { clampPracticeQuestionCount } from '../domain/practiceRules';
import type { GuessTheWordDirection, PracticeRepository, PracticeSession } from '../domain/practiceTypes';

export function createPracticeSession(repository: PracticeRepository, input: { packageId: string; exerciseType: 'guess_the_word' | 'fill_the_gap' | 'mixed'; unitId?: string; questionCount?: number; direction?: GuessTheWordDirection }): Promise<RepositoryResult<PracticeSession>> {
  return repository.createSession({ ...input, questionCount: clampPracticeQuestionCount(input.questionCount) });
}
