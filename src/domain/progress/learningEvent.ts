export type LearningEventType =
  | 'word_viewed'
  | 'sentence_viewed'
  | 'practice_answered'
  | 'dialogue_started'
  | 'dialogue_choice'
  | 'dialogue_completed'
  | 'session_started'
  | 'session_completed'
  | 'package_updated';

export type LearningEventSource = 'vocabulary' | 'practice' | 'dialogue' | 'system';

export type LearningEvent = {
  eventId: string;
  localSequence: number;
  deviceId: string;
  packageId: string;
  itemId?: string;
  eventType: LearningEventType;
  source: LearningEventSource;
  result?: number;
  weight: number;
  sessionId?: string;
  deviceTime: string;
  localDate: string;
  formulaVersion: number;
  payload: Record<string, unknown>;
};

export type ProgressScope = { packageId: string };

export type ItemProgress = {
  itemId: string;
  strength: number;
  lastReviewedAt?: string;
  lastResult?: number;
};

export type PracticeExerciseStats = {
  sessionsCompleted: number;
  totalAnswered: number;
  correctAnswered: number;
  accuracyPercent: number;
  totalAnswered7Days: number;
  correctAnswered7Days: number;
  accuracy7DaysPercent: number;
};

export type DialogueStats = {
  sessionsCompleted: number;
  endings: Record<string, number>;
};

export type CompletionStats = {
  guessTheWord: PracticeExerciseStats;
  fillTheGap: PracticeExerciseStats;
  dialogue: DialogueStats;
  aiDialogueRemainingQuota: number;
  aiDialogueMaxQuota: number;
};

export type ProgressSnapshot = {
  packageId: string;
  wordStrength: Record<string, ItemProgress>;
  sentenceStrength: Record<string, ItemProgress>;
  mastery: number;
  level: 1 | 2 | 3 | 4 | 5;
  highestLevel: 1 | 2 | 3 | 4 | 5;
  activeDays: string[];
  currentStreak: number;
  sessionsStarted: number;
  sessionsCompleted: number;
  dialogueScores: Record<string, number>;
  newItemIds: string[];
  completionStats: CompletionStats;
};
