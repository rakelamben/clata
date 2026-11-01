import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { AudioReference } from '../../vocabulary/domain/vocabularyTypes';

export type PracticeExerciseType = 'guess_the_word' | 'fill_the_gap' | 'mixed';
export type GuessTheWordDirection = 'word_to_meaning' | 'meaning_to_word' | 'audio_to_meaning';
export type PracticeSessionStatus = 'created' | 'active' | 'completed' | 'interrupted' | 'abandoned';

export type PracticeOption = { optionId: string; label: string; itemId: string; packageId: string };
export type SentencePreview = { sentenceId: string; text: string; translation?: string; audio?: AudioReference };

export type GuessTheWordQuestion = {
  type: 'guess_the_word'; questionId: string; packageId: string; targetItemId: string;
  direction: GuessTheWordDirection; prompt: { lemma?: string; meaning?: string; audio?: AudioReference };
  options: PracticeOption[]; correctOptionId: string; exampleSentence?: SentencePreview;
};

export type FillTheGapQuestion = {
  type: 'fill_the_gap'; questionId: string; packageId: string; sentenceId: string; missingWordId: string;
  beforeGap: string; afterGap: string; translation: string; options: PracticeOption[]; correctOptionId: string; audio?: AudioReference;
  gapCount: number;
};

export type PracticeQuestion = GuessTheWordQuestion | FillTheGapQuestion;

export type PracticeSession = {
  sessionId: string; packageId: string; exerciseType: PracticeExerciseType; unitId?: string;
  direction?: GuessTheWordDirection; questionIds: string[]; questionCount: number; currentIndex: number;
  answeredCount: number; correctCount: number; status: PracticeSessionStatus; startedAt: string; completedAt?: string;
};

export type PracticeWordCandidate = {
  packageId: string; id: string; unitId: string; unitOrder: number; itemOrder: number; lemma: string;
  meaning: string; register: string; partOfSpeech?: string; theme?: string; audio?: AudioReference | null;
  lastResult?: number; strength?: number; lastReviewedAt?: string; viewed?: boolean;
};

export type PracticeSentenceCandidate = {
  packageId: string; id: string; unitId: string; unitOrder: number; itemOrder: number; text: string;
  translation: string; gapWordId: string; register?: string; level?: string; audio?: AudioReference | null;
};

export type PracticeUnitInfo = {
  id: string;
  title: string;
  order: number;
  wordCount: number;
  sentenceCount: number;
  dialogueCount: number;
};

export type PracticeRepository = {
  getAvailability(packageId: string, exerciseType: PracticeExerciseType, unitId?: string, direction?: GuessTheWordDirection): Promise<RepositoryResult<{ available: boolean; reason?: string; count: number }>>;
  getUnits(packageId: string): Promise<RepositoryResult<PracticeUnitInfo[]>>;
  createSession(input: { packageId: string; exerciseType: PracticeExerciseType; unitId?: string; questionCount: number; direction?: GuessTheWordDirection }): Promise<RepositoryResult<PracticeSession>>;
  getSession(sessionId: string): Promise<RepositoryResult<PracticeSession | null>>;
  getInterruptedSession(packageId: string): Promise<RepositoryResult<PracticeSession | null>>;
  getQuestion(sessionId: string, index: number): Promise<RepositoryResult<PracticeQuestion | null>>;
  submitAnswer(input: { sessionId: string; questionId: string; optionId: string }): Promise<RepositoryResult<{ correct: boolean; correctOptionId: string; answerLabel: string; nextIndex: number; sessionCompleted: boolean }>>;
  completeSession(sessionId: string): Promise<RepositoryResult<void>>;
  abandonSession(sessionId: string): Promise<RepositoryResult<void>>;
};
