import { describe, expect, it } from 'vitest';
import {
  assertNoLearningEventEmitted,
  getSafetyGuidanceForChallenge,
  getDefaultRescuePhrases,
} from '../../../src/features/challenges/domain/challengeInvariants';
import type { Challenge } from '../../../src/features/challenges/domain/challengeTypes';

describe('challengeInvariants', () => {
  it('passes when event count is completely unchanged before and after action', () => {
    expect(() => assertNoLearningEventEmitted(5, 5)).not.toThrow();
  });

  it('throws invariant violation error if a learning event was emitted', () => {
    expect(() => assertNoLearningEventEmitted(5, 6)).toThrow(
      /Invariant violation: Challenge interaction emitted a learning event/,
    );
  });

  it('ensures safety guidance is always present for minor safety', () => {
    const rawChallenge: Challenge = {
      id: 'ch-1',
      packageId: 'jawa-mataraman',
      unitId: 'unit-1',
      level: 'L1',
      title: 'Tantangan Sapaan',
      solo: 'Ucapkan sugeng enjing.',
      social: 'Sapa temanmu.',
    };

    const guidance = getSafetyGuidanceForChallenge(rawChallenge);
    expect(guidance).toBeTruthy();
    expect(guidance.length).toBeGreaterThan(10);
  });

  it('ensures rescue phrases are present for beginner support', () => {
    const rawChallenge: Challenge = {
      id: 'ch-1',
      packageId: 'jawa-mataraman',
      unitId: 'unit-1',
      level: 'L1',
      title: 'Tantangan Sapaan',
      solo: 'Ucapkan sugeng enjing.',
      social: 'Sapa temanmu.',
    };

    const rescue = getDefaultRescuePhrases(rawChallenge);
    expect(rescue.length).toBeGreaterThanOrEqual(1);
    expect(rescue[0].text).toBeDefined();
    expect(rescue[0].translation).toBeDefined();
  });
});
