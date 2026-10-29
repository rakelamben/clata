import { describe, expect, it } from 'vitest';
import { validatePracticeQuestion } from '../../../src/features/practice/domain/questionValidation';
import type { GuessTheWordQuestion } from '../../../src/features/practice/domain/practiceTypes';

const question: GuessTheWordQuestion = {
  type: 'guess_the_word', questionId: 'q1', packageId: 'pkg', targetItemId: 'w1', direction: 'word_to_meaning',
  prompt: { lemma: 'sugeng' }, options: [
    { optionId: 'w1', label: 'selamat', itemId: 'w1', packageId: 'pkg' },
    { optionId: 'w2', label: 'pagi', itemId: 'w2', packageId: 'pkg' },
    { optionId: 'w3', label: 'malam', itemId: 'w3', packageId: 'pkg' },
    { optionId: 'w4', label: 'siang', itemId: 'w4', packageId: 'pkg' },
  ], correctOptionId: 'w1',
};

describe('practice question validation', () => {
  it('accepts a four-option question with one answer', () => {
    expect(validatePracticeQuestion(question)).toEqual({ ok: true });
  });

  it('rejects duplicate normalized option labels', () => {
    expect(validatePracticeQuestion({ ...question, options: question.options.map((option, index) => index === 2 ? { ...option, label: 'Selamat' } : option) })).toMatchObject({ ok: false, reason: 'AMBIGUOUS' });
  });

  it('rejects a missing correct option', () => {
    expect(validatePracticeQuestion({ ...question, correctOptionId: 'missing' })).toMatchObject({ ok: false, reason: 'INVALID_TARGET' });
  });
});
