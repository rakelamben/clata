import { calculateCurrentStreak } from './streak';
import { initialStrength, updateStrength } from './strength';
import { withMastery } from './mastery';
import type { LearningEvent, ProgressScope, ProgressSnapshot, ItemProgress } from './learningEvent';

function ordered(events: LearningEvent[]): LearningEvent[] {
  return [...events].sort((a, b) => a.localSequence - b.localSequence || a.eventId.localeCompare(b.eventId));
}

function item(map: Record<string, ItemProgress>, itemId: string, event: LearningEvent): ItemProgress {
  return map[itemId] ?? { itemId, strength: initialStrength(), lastReviewedAt: event.deviceTime };
}

export function replayProgress(events: LearningEvent[], scope: ProgressScope, today: string, newItemIds: string[] = []): ProgressSnapshot {
  const wordStrength: Record<string, ItemProgress> = {};
  const sentenceStrength: Record<string, ItemProgress> = {};
  const dialogueScores: Record<string, number> = {};
  const activeDayWords = new Map<string, Set<string>>();
  const sessions = { started: 0, completed: 0 };

  for (const event of ordered(events).filter((candidate) => candidate.packageId === scope.packageId)) {
    if (event.formulaVersion !== 1) throw new Error(`Unsupported progress formula version: ${event.formulaVersion}`);
    const payload = event.payload;
    if (event.eventType === 'word_viewed' && event.itemId && payload.viewedFrom === 'vocabulary_feed' && payload.foreground === true && Number(payload.durationMs) >= 1000) {
      const current = item(wordStrength, event.itemId, event);
      wordStrength[event.itemId] = { ...current, lastReviewedAt: event.deviceTime };
      const day = activeDayWords.get(event.localDate) ?? new Set<string>();
      day.add(event.itemId);
      activeDayWords.set(event.localDate, day);
    } else if (event.eventType === 'sentence_viewed' && event.itemId && payload.viewedFrom === 'fill_the_gap' && payload.foreground === true && payload.firstDisplay === true) {
      sentenceStrength[event.itemId] = item(sentenceStrength, event.itemId, event);
    } else if (event.eventType === 'practice_answered') {
      const target = String(payload.targetItemId ?? event.itemId ?? '');
      if (!target) continue;
      if (payload.exerciseType === 'guess_the_word') {
        const current = item(wordStrength, target, event);
        const result = payload.correct === true ? 1 : 0;
        wordStrength[target] = { ...current, strength: updateStrength(current.strength, result, event.weight), lastReviewedAt: event.deviceTime, lastResult: result };
      } else if (payload.exerciseType === 'fill_the_gap') {
        const current = item(sentenceStrength, target, event);
        const result = payload.correct === true ? 1 : 0;
        sentenceStrength[target] = { ...current, strength: updateStrength(current.strength, result, event.weight), lastReviewedAt: event.deviceTime, lastResult: result };
      }
    } else if (event.eventType === 'dialogue_completed') {
      const dialogueId = String(payload.dialogueId ?? event.itemId ?? '');
      const score = Number(payload.score);
      if (dialogueId && Number.isFinite(score)) dialogueScores[dialogueId] = Math.max(dialogueScores[dialogueId] ?? 0, Math.max(0, Math.min(1, score)));
    } else if (event.eventType === 'session_started') sessions.started += 1;
    else if (event.eventType === 'session_completed') sessions.completed += 1;
  }

  const activeDays = [...activeDayWords.entries()].filter(([, words]) => words.size >= 10).map(([date]) => date).sort();
  const base = { packageId: scope.packageId, wordStrength, sentenceStrength, activeDays, currentStreak: calculateCurrentStreak(activeDays, today), sessionsStarted: sessions.started, sessionsCompleted: sessions.completed, dialogueScores, newItemIds, highestLevel: 1 as const };
  return withMastery(base);
}
