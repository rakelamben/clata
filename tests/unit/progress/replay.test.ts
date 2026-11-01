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

  it('aggregates completionStats per exercise type, 7-day accuracy, endings, and excludes challenges (FR-61)', () => {
    const today = '2026-10-30';
    const snapshot = replayProgress([
      // Practice answers: guess_the_word (1 correct within 7 days, 1 incorrect 10 days ago)
      event({
        eventId: 'ans-1',
        localSequence: 1,
        localDate: '2026-10-29',
        eventType: 'practice_answered',
        result: 1,
        payload: { exerciseType: 'guess_the_word', targetItemId: 'w1', correct: true },
      }),
      event({
        eventId: 'ans-2',
        localSequence: 2,
        localDate: '2026-10-15',
        eventType: 'practice_answered',
        result: 0,
        payload: { exerciseType: 'guess_the_word', targetItemId: 'w2', correct: false },
      }),
      // Practice answers: fill_the_gap (2 correct within 7 days)
      event({
        eventId: 'ans-3',
        localSequence: 3,
        localDate: '2026-10-30',
        eventType: 'practice_answered',
        result: 1,
        payload: { exerciseType: 'fill_the_gap', targetItemId: 's1', correct: true },
      }),
      event({
        eventId: 'ans-4',
        localSequence: 4,
        localDate: '2026-10-28',
        eventType: 'practice_answered',
        result: 1,
        payload: { exerciseType: 'fill_the_gap', targetItemId: 's2', correct: true },
      }),
      // Sessions completed
      event({
        eventId: 'ses-1',
        localSequence: 5,
        eventType: 'session_completed',
        source: 'system',
        payload: { exerciseType: 'guess_the_word', completed: true },
      }),
      event({
        eventId: 'ses-2',
        localSequence: 6,
        eventType: 'session_completed',
        source: 'system',
        payload: { exerciseType: 'fill_the_gap', completed: true },
      }),
      event({
        eventId: 'ses-3',
        localSequence: 7,
        eventType: 'session_completed',
        source: 'system',
        payload: { exerciseType: 'dialogue', completed: true },
      }),
      // Dialogue completed with endings
      event({
        eventId: 'dlg-1',
        localSequence: 8,
        eventType: 'dialogue_completed',
        source: 'dialogue',
        payload: { dialogueId: 'd1', endingQuality: 'baik', score: 1 },
      }),
      event({
        eventId: 'dlg-2',
        localSequence: 9,
        eventType: 'dialogue_completed',
        source: 'dialogue',
        payload: { dialogueId: 'd2', endingQuality: 'pas', score: 0.5 },
      }),
    ], { packageId: 'pkg' }, today);

    const stats = snapshot.completionStats;

    // Guess the word
    expect(stats.guessTheWord.sessionsCompleted).toBe(1);
    expect(stats.guessTheWord.totalAnswered).toBe(2);
    expect(stats.guessTheWord.correctAnswered).toBe(1);
    expect(stats.guessTheWord.accuracyPercent).toBe(50);
    expect(stats.guessTheWord.totalAnswered7Days).toBe(1);
    expect(stats.guessTheWord.correctAnswered7Days).toBe(1);
    expect(stats.guessTheWord.accuracy7DaysPercent).toBe(100);

    // Fill the gap
    expect(stats.fillTheGap.sessionsCompleted).toBe(1);
    expect(stats.fillTheGap.totalAnswered).toBe(2);
    expect(stats.fillTheGap.correctAnswered).toBe(2);
    expect(stats.fillTheGap.accuracyPercent).toBe(100);
    expect(stats.fillTheGap.totalAnswered7Days).toBe(2);
    expect(stats.fillTheGap.correctAnswered7Days).toBe(2);
    expect(stats.fillTheGap.accuracy7DaysPercent).toBe(100);

    // Dialogue
    expect(stats.dialogue.sessionsCompleted).toBe(1);
    expect(stats.dialogue.endings.baik).toBe(1);
    expect(stats.dialogue.endings.pas).toBe(1);
    expect(stats.dialogue.endings['kurang-pas']).toBe(0);

    // AI Dialogue Quota (Offline MVP)
    expect(stats.aiDialogueRemainingQuota).toBe(0);
    expect(stats.aiDialogueMaxQuota).toBe(3);
  });
});
