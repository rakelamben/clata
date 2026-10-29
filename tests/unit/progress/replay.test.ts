import { describe, expect, it } from 'vitest';
import { replayProgress } from '../../../src/domain/progress/replay';
import type { LearningEvent } from '../../../src/domain/progress/learningEvent';

const event = (overrides: Partial<LearningEvent>): LearningEvent => ({ eventId: 'e', localSequence: 1, deviceId: 'd', packageId: 'pkg', eventType: 'practice_answered', source: 'practice', weight: 1, deviceTime: '2026-01-01T10:00:00.000Z', localDate: '2026-01-01', formulaVersion: 1, payload: { exerciseType: 'guess_the_word', targetItemId: 'w1', correct: true }, ...overrides });

describe('replayProgress', () => {
  it('is deterministic and keeps sentence answers separate from word answers', () => {
    const snapshot = replayProgress([
      event({ eventId: 'a', localSequence: 1 }),
      event({ eventId: 'b', localSequence: 2, payload: { exerciseType: 'fill_the_gap', targetItemId: 's1', correct: false } }),
    ], { packageId: 'pkg' }, '2026-01-01');
    expect(snapshot.wordStrength.w1.strength).toBeCloseTo(0.37);
    expect(snapshot.sentenceStrength.s1.strength).toBeCloseTo(0.07);
    expect(replayProgress([], { packageId: 'pkg' }, '2026-01-01').mastery).toBe(0);
  });
});
