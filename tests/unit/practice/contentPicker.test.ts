import { describe, expect, it } from 'vitest';
import { pickPracticeWords } from '../../../src/features/practice/domain/contentPicker';
import type { PracticeWordCandidate } from '../../../src/features/practice/domain/practiceTypes';

const words: PracticeWordCandidate[] = [
  { packageId: 'pkg', id: 'weak', unitId: 'u1', unitOrder: 1, itemOrder: 1, lemma: 'lemah', meaning: 'weak', register: 'neutral', lastResult: 0, strength: 0.2 },
  { packageId: 'pkg', id: 'new', unitId: 'u1', unitOrder: 1, itemOrder: 2, lemma: 'anyar', meaning: 'new', register: 'neutral', strength: 0.5 },
  { packageId: 'other', id: 'other', unitId: 'u1', unitOrder: 1, itemOrder: 1, lemma: 'lain', meaning: 'other', register: 'neutral', strength: 0 },
];

describe('practice content picker', () => {
  it('is package scoped and prioritizes last incorrect answers', () => {
    expect(pickPracticeWords(words, { packageId: 'pkg', count: 2, seed: 's' }).map((word) => word.id)).toEqual(['weak', 'new']);
  });

  it('returns deterministic ordering for the same seed', () => {
    const request = { packageId: 'pkg', count: 2, seed: 'same' } as const;
    expect(pickPracticeWords(words, request)).toEqual(pickPracticeWords(words, request));
  });
});
