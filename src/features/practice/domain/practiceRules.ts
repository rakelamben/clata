export const DEFAULT_PRACTICE_QUESTION_COUNT = 10;
export const MAX_PRACTICE_QUESTION_COUNT = 20;

export function clampPracticeQuestionCount(value?: number): number {
  return Math.min(MAX_PRACTICE_QUESTION_COUNT, Math.max(1, Math.floor(value ?? DEFAULT_PRACTICE_QUESTION_COUNT)));
}
