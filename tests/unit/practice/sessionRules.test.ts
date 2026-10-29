import { describe, expect, it } from 'vitest';
import { nextPracticeSessionStatus, canCompletePracticeSession } from '../../../src/features/practice/domain/practiceSession';

describe('practice session rules', () => {
  it('does not complete before all questions are answered', () => {
    expect(canCompletePracticeSession({ questionCount: 10, answeredCount: 9 })).toBe(false);
    expect(canCompletePracticeSession({ questionCount: 10, answeredCount: 10 })).toBe(true);
  });

  it('moves created sessions to active and completed sessions to interrupted on exit', () => {
    expect(nextPracticeSessionStatus('created', 'start')).toBe('active');
    expect(nextPracticeSessionStatus('active', 'interrupt')).toBe('interrupted');
    expect(nextPracticeSessionStatus('active', 'complete')).toBe('completed');
  });
});
