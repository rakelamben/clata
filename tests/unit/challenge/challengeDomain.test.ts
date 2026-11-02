import { describe, expect, it } from 'vitest';
import {
  computeChallengeLevel,
  getChallengeLevelLabel,
} from '../../../src/features/challenge/domain/challengeTypes';

describe('challengeDomain', () => {
  it('computes level L1 (Ringan) for duration <= 3 minutes or undefined', () => {
    expect(computeChallengeLevel(undefined)).toBe('L1');
    expect(computeChallengeLevel(1)).toBe('L1');
    expect(computeChallengeLevel(3)).toBe('L1');
  });

  it('computes level L2 (Sedang) for duration between 4 and 7 minutes', () => {
    expect(computeChallengeLevel(4)).toBe('L2');
    expect(computeChallengeLevel(5)).toBe('L2');
    expect(computeChallengeLevel(7)).toBe('L2');
  });

  it('computes level L3 (Besar) for duration > 7 minutes', () => {
    expect(computeChallengeLevel(8)).toBe('L3');
    expect(computeChallengeLevel(10)).toBe('L3');
  });

  it('returns appropriate labels for levels', () => {
    expect(getChallengeLevelLabel('L1')).toBe('Ringan');
    expect(getChallengeLevelLabel('L2')).toBe('Sedang');
    expect(getChallengeLevelLabel('L3')).toBe('Besar');
  });
});
