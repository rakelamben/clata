import type {
  DialogueItem,
  SentenceItem,
  WordItem,
} from '../../../domain/package/packageTypes';
import {
  generateWordGuessQuestions,
  type WordGuessQuestion,
} from './wordGuessEngine';
import {
  generateFillGapQuestions,
  type SentenceFillGapQuestion,
} from './sentenceFillGapEngine';

export type QuickQuizQuestion =
  | { type: 'word_guess'; data: WordGuessQuestion }
  | { type: 'fill_gap'; data: SentenceFillGapQuestion };

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Memilih kata-kata secara acak lintas unit untuk Latihan Bebas - Tebak Kata
 */
export function selectFreeWordGuessItems(
  words: WordItem[],
  count = 10,
): WordItem[] {
  if (words.length <= count) return shuffleArray(words);
  return shuffleArray(words).slice(0, count);
}

/**
 * Memilih kalimat secara acak lintas unit untuk Latihan Bebas - Kalimat Rumpang
 */
export function selectFreeFillGapItems(
  sentences: SentenceItem[],
  count = 8,
): SentenceItem[] {
  if (sentences.length <= count) return shuffleArray(sentences);
  return shuffleArray(sentences).slice(0, count);
}

/**
 * Memilih salah satu skenario percakapan secara acak lintas unit untuk Latihan Bebas - Percakapan
 */
export function selectFreeDialogue(
  dialogues: DialogueItem[],
): DialogueItem | null {
  if (dialogues.length === 0) return null;
  const index = Math.floor(Math.random() * dialogues.length);
  return dialogues[index] || null;
}

/**
 * Menghasilkan set soal gabungan (Tebak Kata & Kalimat Rumpang) untuk Latihan Cepat
 */
export function generateQuickQuizItems(
  words: WordItem[],
  sentences: SentenceItem[],
  wordCount = 5,
  sentenceCount = 5,
): QuickQuizQuestion[] {
  if (words.length === 0 && sentences.length === 0) return [];

  const shuffledWords = selectFreeWordGuessItems(words, wordCount);
  const shuffledSentences = selectFreeFillGapItems(sentences, sentenceCount);

  const wordQuestions = generateWordGuessQuestions(
    shuffledWords,
    sentences,
    words,
  );
  const gapQuestions = generateFillGapQuestions(shuffledSentences, words);

  const mixed: QuickQuizQuestion[] = [
    ...wordQuestions.map((q) => ({ type: 'word_guess' as const, data: q })),
    ...gapQuestions.map((q) => ({ type: 'fill_gap' as const, data: q })),
  ];

  return shuffleArray(mixed);
}
