import type { PracticeWordCandidate } from './practiceTypes';

export function pickPracticeWords(words: PracticeWordCandidate[], request: { packageId: string; unitId?: string; count: number; seed: string; today?: string }): PracticeWordCandidate[] {
  const candidates = words.filter((word) => word.packageId === request.packageId && (!request.unitId || word.unitId === request.unitId));
  return [...candidates].sort((a, b) => score(a, request.today) - score(b, request.today) || hash(`${request.seed}:${a.id}`) - hash(`${request.seed}:${b.id}`) || a.unitOrder - b.unitOrder || a.itemOrder - b.itemOrder || a.id.localeCompare(b.id)).slice(0, Math.max(0, Math.min(20, request.count)));
}

function score(word: PracticeWordCandidate, today?: string): number {
  if (word.lastResult === 0) return -1;
  if (typeof word.strength === 'number') {
    const days = today && word.lastReviewedAt ? Math.max(0, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(word.lastReviewedAt)) / 86400000)) : 0;
    return word.strength * (0.97 ** days);
  }
  return 0.5;
}

function hash(value: string): number { let result = 2166136261; for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619); return result >>> 0; }
