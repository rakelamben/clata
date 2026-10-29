import type { Clock } from '../../../domain/ports/Clock';
import type { LearningEvent } from '../../../domain/progress/learningEvent';
import type { SQLiteProgressRepository } from '../../progress/data/progressRepository';

export async function recordWordViewed(progress: SQLiteProgressRepository, input: { packageId: string; itemId: string; sessionId: string; durationMs: number; deviceId: string }, clock: Clock) {
  const now = clock.now();
  const event: LearningEvent = {
    eventId: `vocabulary:${input.packageId}:${input.sessionId}:${input.itemId}`,
    localSequence: 0,
    deviceId: input.deviceId,
    packageId: input.packageId,
    itemId: input.itemId,
    eventType: 'word_viewed',
    source: 'vocabulary',
    weight: 1,
    sessionId: input.sessionId,
    deviceTime: now.toISOString(),
    localDate: now.toISOString().slice(0, 10),
    formulaVersion: 1,
    payload: { itemId: input.itemId, viewedFrom: 'vocabulary_feed', durationMs: input.durationMs, foreground: true },
  };
  return progress.appendEvent(event);
}
