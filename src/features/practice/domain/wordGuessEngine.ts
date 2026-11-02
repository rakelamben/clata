import type { SentenceItem, WordItem } from '../../../domain/package/packageTypes';

export interface WordGuessOption {
  id: string;
  label: 'A' | 'B' | 'C';
  text: string;
  isCorrect: boolean;
  audio?: string;
}

export interface WordGuessQuestion {
  id: string;
  wordId: string;
  wordText: string;
  wordMeaning: string;
  wordAudio?: string;
  exampleSentence?: string;
  options: WordGuessOption[];
  correctOptionId: string;
  isRetry: boolean;
}

export interface WordGuessSessionStats {
  totalQuestions: number;
  firstAttemptCorrect: number;
  firstAttemptWrong: number;
  accuracyPercentage: number;
}

/**
 * Pengacak array sederhana untuk opsi dan pengecoh
 */
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
 * Mencari contoh kalimat penggunaan kata dalam Bahasa Jawa dari koleksi kalimat
 */
export function findExampleSentence(
  wordId: string,
  sentences: SentenceItem[],
): string | undefined {
  const matched = sentences.find(
    (s) => s.focus_word_id === wordId || s.word_ids?.includes(wordId),
  );
  return matched?.text;
}

/**
 * Membangkitkan satu soal Tebak Kata dengan acak 2 pilihan (A, B) atau 3 pilihan (A, B, C)
 */
export function createWordGuessQuestion(
  word: WordItem,
  sentences: SentenceItem[],
  allWords: WordItem[],
  forceOptionCount?: 2 | 3,
): WordGuessQuestion {
  const exampleSentence = findExampleSentence(word.id, sentences);

  // Tentukan jumlah opsi secara acak: 2 opsi (A, B) atau 3 opsi (A, B, C)
  const optionCount: 2 | 3 =
    forceOptionCount ?? (Math.random() < 0.5 ? 2 : 3);
  const distractorCount = optionCount - 1; // 1 atau 2 pengecoh

  // Ambil kata pengecoh dari kosakata lain yang maknanya berbeda
  const availableDistractors = allWords.filter(
    (w) => w.id !== word.id && w.meaning !== word.meaning,
  );
  const shuffledDistractors = shuffleArray(availableDistractors).slice(
    0,
    distractorCount,
  );

  const rawOptions: Omit<WordGuessOption, 'label'>[] = [
    {
      id: word.id,
      text: word.meaning,
      isCorrect: true,
      audio: word.audio,
    },
    ...shuffledDistractors.map((d) => ({
      id: d.id,
      text: d.meaning,
      isCorrect: false,
      audio: d.audio,
    })),
  ];

  // Acak posisi jawaban benar dan pasang label A, B, atau C
  const shuffledOptions = shuffleArray(rawOptions);
  const labels: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

  const options: WordGuessOption[] = shuffledOptions.map((opt, idx) => ({
    ...opt,
    label: labels[idx],
  }));

  return {
    id: `q-${word.id}`,
    wordId: word.id,
    wordText: word.text,
    wordMeaning: word.meaning,
    wordAudio: word.audio,
    exampleSentence,
    options,
    correctOptionId: word.id,
    isRetry: false,
  };
}

/**
 * Membangkitkan seluruh daftar soal untuk satu sesi Tebak Kata
 */
export function generateWordGuessQuestions(
  sessionWords: WordItem[],
  allSentences: SentenceItem[],
  allWords: WordItem[],
): WordGuessQuestion[] {
  return sessionWords.map((word) =>
    createWordGuessQuestion(word, allSentences, allWords),
  );
}

/**
 * Engine pengelola alur sesi Tebak Kata dengan Loop Revisi di akhir sesi
 */
export class WordGuessSessionEngine {
  private mainQueue: WordGuessQuestion[];
  private retryQueue: WordGuessQuestion[] = [];
  private currentQuestionItem: WordGuessQuestion | null = null;
  private firstAttemptResults = new Map<string, boolean>(); // wordId -> benar/salah

  constructor(questions: WordGuessQuestion[]) {
    this.mainQueue = [...questions];
    this.advanceNext();
  }

  getCurrentQuestion(): WordGuessQuestion | null {
    return this.currentQuestionItem;
  }

  getRemainingCount(): number {
    return (
      (this.currentQuestionItem ? 1 : 0) +
      this.mainQueue.length +
      this.retryQueue.length
    );
  }

  getTotalInitialCount(): number {
    return (
      this.firstAttemptResults.size +
      (this.currentQuestionItem && !this.currentQuestionItem.isRetry ? 1 : 0) +
      this.mainQueue.length
    );
  }

  isCompleted(): boolean {
    return (
      this.currentQuestionItem === null &&
      this.mainQueue.length === 0 &&
      this.retryQueue.length === 0
    );
  }

  isRetryPhase(): boolean {
    return Boolean(this.currentQuestionItem?.isRetry);
  }

  /**
   * Evaluasi jawaban pengguna
   */
  submitAnswer(selectedOptionId: string): {
    isCorrect: boolean;
    correctOption: WordGuessOption | undefined;
    explanation: string;
  } {
    const q = this.currentQuestionItem;
    if (!q) {
      throw new Error('Tidak ada pertanyaan aktif yang dapat dijawab.');
    }

    const isCorrect = selectedOptionId === q.correctOptionId;
    const correctOption = q.options.find((o) => o.isCorrect);

    // Catat statistik jika ini adalah percobaan pertama
    if (!q.isRetry && !this.firstAttemptResults.has(q.wordId)) {
      this.firstAttemptResults.set(q.wordId, isCorrect);
    }

    // Jika salah, masukkan ke antrean revisi (Opsi 1: Loop Soal Salah di Akhir)
    if (!isCorrect) {
      const retryQuestion: WordGuessQuestion = {
        ...q,
        isRetry: true,
      };
      this.retryQueue.push(retryQuestion);
    }

    const explanation = `${q.wordText} berarti ${q.wordMeaning}`;

    return {
      isCorrect,
      correctOption,
      explanation,
    };
  }

  /**
   * Melangkah ke soal berikutnya dalam antrean
   */
  advanceNext(): WordGuessQuestion | null {
    if (this.mainQueue.length > 0) {
      this.currentQuestionItem = this.mainQueue.shift() ?? null;
      return this.currentQuestionItem;
    }

    if (this.retryQueue.length > 0) {
      this.currentQuestionItem = this.retryQueue.shift() ?? null;
      return this.currentQuestionItem;
    }

    this.currentQuestionItem = null;
    return null;
  }

  /**
   * Menghitung statistik akhir sesi latihan
   */
  getStats(): WordGuessSessionStats {
    let firstAttemptCorrect = 0;
    let firstAttemptWrong = 0;

    for (const isCorrect of this.firstAttemptResults.values()) {
      if (isCorrect) {
        firstAttemptCorrect++;
      } else {
        firstAttemptWrong++;
      }
    }

    const total = firstAttemptCorrect + firstAttemptWrong;
    const accuracyPercentage =
      total > 0 ? Math.round((firstAttemptCorrect / total) * 100) : 0;

    return {
      totalQuestions: total,
      firstAttemptCorrect,
      firstAttemptWrong,
      accuracyPercentage,
    };
  }
}
