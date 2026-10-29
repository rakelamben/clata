import type { ItemProgress, ProgressSnapshot } from './learningEvent';

export function levelForMastery(mastery: number): 1 | 2 | 3 | 4 | 5 {
  if (mastery < 20) return 1;
  if (mastery < 40) return 2;
  if (mastery < 60) return 3;
  if (mastery < 80) return 4;
  return 5;
}

export function averageStrength(items: Record<string, ItemProgress>): number {
  const values = Object.values(items);
  return values.length === 0 ? 0 : values.reduce((sum, item) => sum + item.strength, 0) / values.length;
}

export function calculateMastery(wordStrength: Record<string, ItemProgress>, sentenceStrength: Record<string, ItemProgress>, dialogueScores: Record<string, number>): number {
  const vocabulary = averageStrength(wordStrength);
  const sentences = averageStrength(sentenceStrength);
  const dialogueValues = Object.values(dialogueScores);
  const dialogue = dialogueValues.length === 0 ? 0 : dialogueValues.reduce((sum, value) => sum + value, 0) / dialogueValues.length;
  return Math.max(0, Math.min(100, 100 * (0.5 * vocabulary + 0.25 * sentences + 0.25 * dialogue)));
}

export function withMastery(snapshot: Omit<ProgressSnapshot, 'mastery' | 'level'> & { highestLevel: ProgressSnapshot['highestLevel'] }): ProgressSnapshot {
  const mastery = calculateMastery(snapshot.wordStrength, snapshot.sentenceStrength, snapshot.dialogueScores);
  const level = levelForMastery(mastery);
  return { ...snapshot, mastery, level, highestLevel: Math.max(snapshot.highestLevel, level) as ProgressSnapshot['highestLevel'] };
}
