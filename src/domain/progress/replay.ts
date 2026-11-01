import { calculateCurrentStreak } from './streak';
import { initialStrength, updateStrength } from './strength';
import { withMastery } from './mastery';
import type { LearningEvent, ProgressScope, ProgressSnapshot, ItemProgress, CompletionStats } from './learningEvent';

function ordered(events: LearningEvent[]): LearningEvent[] {
  return [...events].sort((a, b) => a.localSequence - b.localSequence || a.eventId.localeCompare(b.eventId));
}

function item(map: Record<string, ItemProgress>, itemId: string, event: LearningEvent): ItemProgress {
  return map[itemId] ?? { itemId, strength: initialStrength(), lastReviewedAt: event.deviceTime };
}

function isWithin7Days(dateStr: string, todayStr: string): boolean {
  if (!dateStr || !todayStr) return false;
  const eventTime = new Date(`${dateStr}T00:00:00Z`).getTime();
  const todayTime = new Date(`${todayStr}T00:00:00Z`).getTime();
  const diffDays = Math.floor((todayTime - eventTime) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays < 7;
}

export function replayProgress(events: LearningEvent[], scope: ProgressScope, today: string, newItemIds: string[] = []): ProgressSnapshot {
  const wordStrength: Record<string, ItemProgress> = {};
  const sentenceStrength: Record<string, ItemProgress> = {};
  const dialogueScores: Record<string, number> = {};
  const activeDayWords = new Map<string, Set<string>>();
  const sessions = { started: 0, completed: 0 };

  const guessStats = {
    sessionsCompleted: 0,
    totalAnswered: 0,
    correctAnswered: 0,
    totalAnswered7Days: 0,
    correctAnswered7Days: 0,
  };
  const gapStats = {
    sessionsCompleted: 0,
    totalAnswered: 0,
    correctAnswered: 0,
    totalAnswered7Days: 0,
    correctAnswered7Days: 0,
  };
  const dialogueEndings: Record<string, number> = {
    baik: 0,
    pas: 0,
    'kurang-pas': 0,
  };
  let dialogueSessionsCompleted = 0;

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
      const isCorrect = payload.correct === true || event.result === 1;
      const within7Days = isWithin7Days(event.localDate, today);

      if (payload.exerciseType === 'guess_the_word') {
        const current = item(wordStrength, target, event);
        const result = isCorrect ? 1 : 0;
        wordStrength[target] = { ...current, strength: updateStrength(current.strength, result, event.weight), lastReviewedAt: event.deviceTime, lastResult: result };
        guessStats.totalAnswered += 1;
        if (isCorrect) guessStats.correctAnswered += 1;
        if (within7Days) {
          guessStats.totalAnswered7Days += 1;
          if (isCorrect) guessStats.correctAnswered7Days += 1;
        }
      } else if (payload.exerciseType === 'fill_the_gap') {
        const current = item(sentenceStrength, target, event);
        const result = isCorrect ? 1 : 0;
        sentenceStrength[target] = { ...current, strength: updateStrength(current.strength, result, event.weight), lastReviewedAt: event.deviceTime, lastResult: result };
        gapStats.totalAnswered += 1;
        if (isCorrect) gapStats.correctAnswered += 1;
        if (within7Days) {
          gapStats.totalAnswered7Days += 1;
          if (isCorrect) gapStats.correctAnswered7Days += 1;
        }
      }
    } else if (event.eventType === 'dialogue_completed') {
      const dialogueId = String(payload.dialogueId ?? event.itemId ?? '');
      const score = Number(payload.score);
      if (dialogueId && Number.isFinite(score)) dialogueScores[dialogueId] = Math.max(dialogueScores[dialogueId] ?? 0, Math.max(0, Math.min(1, score)));
      const rawQuality = String(payload.endingQuality ?? payload.quality ?? payload.endingId ?? 'pas');
      dialogueEndings[rawQuality] = (dialogueEndings[rawQuality] ?? 0) + 1;
    } else if (event.eventType === 'session_started') {
      sessions.started += 1;
    } else if (event.eventType === 'session_completed') {
      sessions.completed += 1;
      if (payload.exerciseType === 'guess_the_word') {
        guessStats.sessionsCompleted += 1;
      } else if (payload.exerciseType === 'fill_the_gap') {
        gapStats.sessionsCompleted += 1;
      } else if (payload.exerciseType === 'dialogue') {
        dialogueSessionsCompleted += 1;
      }
    }
  }

  const calcAccuracy = (correct: number, total: number) => (total > 0 ? Math.round((correct / total) * 100) : 0);

  const completionStats: CompletionStats = {
    guessTheWord: {
      sessionsCompleted: guessStats.sessionsCompleted,
      totalAnswered: guessStats.totalAnswered,
      correctAnswered: guessStats.correctAnswered,
      accuracyPercent: calcAccuracy(guessStats.correctAnswered, guessStats.totalAnswered),
      totalAnswered7Days: guessStats.totalAnswered7Days,
      correctAnswered7Days: guessStats.correctAnswered7Days,
      accuracy7DaysPercent: calcAccuracy(guessStats.correctAnswered7Days, guessStats.totalAnswered7Days),
    },
    fillTheGap: {
      sessionsCompleted: gapStats.sessionsCompleted,
      totalAnswered: gapStats.totalAnswered,
      correctAnswered: gapStats.correctAnswered,
      accuracyPercent: calcAccuracy(gapStats.correctAnswered, gapStats.totalAnswered),
      totalAnswered7Days: gapStats.totalAnswered7Days,
      correctAnswered7Days: gapStats.correctAnswered7Days,
      accuracy7DaysPercent: calcAccuracy(gapStats.correctAnswered7Days, gapStats.totalAnswered7Days),
    },
    dialogue: {
      sessionsCompleted: dialogueSessionsCompleted,
      endings: dialogueEndings,
    },
    aiDialogueRemainingQuota: 0,
    aiDialogueMaxQuota: 3,
  };

  const activeDays = [...activeDayWords.entries()].filter(([, words]) => words.size >= 10).map(([date]) => date).sort();
  const base = {
    packageId: scope.packageId,
    wordStrength,
    sentenceStrength,
    activeDays,
    currentStreak: calculateCurrentStreak(activeDays, today),
    sessionsStarted: sessions.started,
    sessionsCompleted: sessions.completed,
    dialogueScores,
    newItemIds,
    completionStats,
    highestLevel: 1 as const,
  };
  return withMastery(base);
}
