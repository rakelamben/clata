import type { PracticeSessionStatus } from './practiceTypes';

export function canCompletePracticeSession(input: { questionCount: number; answeredCount: number }): boolean { return input.questionCount > 0 && input.answeredCount >= input.questionCount; }

export function nextPracticeSessionStatus(status: PracticeSessionStatus, action: 'start' | 'interrupt' | 'complete' | 'abandon'): PracticeSessionStatus {
  if (action === 'start' && (status === 'created' || status === 'interrupted')) return 'active';
  if (action === 'interrupt' && status === 'active') return 'interrupted';
  if (action === 'complete' && status === 'active') return 'completed';
  if (action === 'abandon' && status !== 'completed') return 'abandoned';
  return status;
}
