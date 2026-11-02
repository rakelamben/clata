import type { SentenceItem, WordItem } from '../../../domain/package/packageTypes';

export interface FillGapChip {
  id: string;
  text: string;
  isDistractor: boolean;
}

export type FillGapSentenceToken =
  | { type: 'text'; text: string }
  | { type: 'slot'; slotIndex: number; expectedText: string };

export interface SentenceFillGapQuestion {
  id: string;
  sentenceId: string;
  fullText: string;
  translation: string;
  audio?: string;
  tokens: FillGapSentenceToken[];
  blankCount: number;
  correctTokens: string[];
  poolChips: FillGapChip[];
  isRetry: boolean;
}

export interface SentenceFillGapStats {
  totalQuestions: number;
  firstAttemptCorrect: number;
  firstAttemptWrong: number;
  accuracyPercentage: number;
}

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
 * Membagi teks kalimat menjadi kata-kata dan menentukan 1 s.d. 3 kata untuk dijadikan rumpang
 */
export function createFillGapQuestion(
  sentence: SentenceItem,
  allWords: WordItem[],
  customBlankCount?: number,
): SentenceFillGapQuestion {
  // Bersihkan tanda baca di ujung kalimat jika ada untuk tokenisasi yang rapi
  const rawWords = sentence.text.trim().split(/\s+/);

  // Tentukan kata mana yang akan dirumpangkan
  // Prioritas 1: focus_word_id jika cocok dengan kata dalam kalimat
  // Prioritas 2: kata-kata di word_ids
  const focusWord = sentence.focus_word_id
    ? allWords.find((w) => w.id === sentence.focus_word_id)?.text.toLowerCase()
    : undefined;

  const sentenceWordTexts = (sentence.word_ids || [])
    .map((wid) => allWords.find((w) => w.id === wid)?.text.toLowerCase())
    .filter((t): t is string => Boolean(t));

  const blankIndices = new Set<number>();

  // Cari posisi focus_word jika ada
  if (focusWord) {
    const fIdx = rawWords.findIndex(
      (rw) => rw.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') === focusWord,
    );
    if (fIdx !== -1) {
      blankIndices.add(fIdx);
    }
  }

  // Tentukan target jumlah rumpang: 1 s.d. 3 (atau maksimal rawWords.length - 1)
  const maxPossibleBlanks = Math.max(1, Math.min(3, rawWords.length - 1));
  const targetBlankCount = customBlankCount
    ? Math.min(customBlankCount, maxPossibleBlanks)
    : Math.min(maxPossibleBlanks, Math.max(1, Math.floor(rawWords.length / 2)));

  // Tambahkan kata dari sentenceWordTexts jika slot belum mencapai targetBlankCount
  for (const wText of sentenceWordTexts) {
    if (blankIndices.size >= targetBlankCount) break;
    const idx = rawWords.findIndex(
      (rw, i) =>
        !blankIndices.has(i) &&
        rw.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') === wText,
    );
    if (idx !== -1) {
      blankIndices.add(idx);
    }
  }

  // Jika masih belum ada rumpang (misal kalimat tanpa focus word), ambil kata terakhir atau kata tengah
  if (blankIndices.size === 0) {
    const fallbackIdx = rawWords.length > 1 ? rawWords.length - 1 : 0;
    blankIndices.add(fallbackIdx);
  }

  // Bangkitkan token kalimat dan daftar jawaban benar secara berurutan
  const correctTokens: string[] = [];
  const tokens: FillGapSentenceToken[] = [];

  let currentSlot = 0;
  rawWords.forEach((wordText, i) => {
    if (blankIndices.has(i)) {
      const cleanToken = wordText.replace(/[^a-zA-Z0-9]/g, '');
      correctTokens.push(cleanToken);
      tokens.push({
        type: 'slot',
        slotIndex: currentSlot++,
        expectedText: cleanToken,
      });
    } else {
      tokens.push({
        type: 'text',
        text: wordText,
      });
    }
  });

  // Siapkan chip jawaban benar
  const correctChips: FillGapChip[] = correctTokens.map((ct, idx) => ({
    id: `correct-${idx}-${ct}`,
    text: ct,
    isDistractor: false,
  }));

  // Siapkan 2 s.d. 4 kata pengecoh (distractor) dari allWords yang bukan bagian dari correctTokens
  const distractorCount = Math.min(4, Math.max(2, targetBlankCount + 1));
  const availableDistractors = allWords
    .filter(
      (w) =>
        !correctTokens.some(
          (ct) => ct.toLowerCase() === w.text.toLowerCase(),
        ),
    )
    .map((w) => w.text.toLowerCase());

  const uniqueDistractorTexts = Array.from(new Set(availableDistractors));
  const pickedDistractors = shuffleArray(uniqueDistractorTexts).slice(
    0,
    distractorCount,
  );

  const distractorChips: FillGapChip[] = pickedDistractors.map((dt, idx) => ({
    id: `distractor-${idx}-${dt}`,
    text: dt,
    isDistractor: true,
  }));

  const poolChips = shuffleArray([...correctChips, ...distractorChips]);

  return {
    id: `fg-${sentence.id}`,
    sentenceId: sentence.id,
    fullText: sentence.text,
    translation: sentence.translation,
    audio: sentence.audio,
    tokens,
    blankCount: correctTokens.length,
    correctTokens,
    poolChips,
    isRetry: false,
  };
}

/**
 * Membangkitkan seluruh soal kalimat rumpang untuk satu sesi
 */
export function generateFillGapQuestions(
  sentences: SentenceItem[],
  allWords: WordItem[],
): SentenceFillGapQuestion[] {
  return sentences.map((s) => createFillGapQuestion(s, allWords));
}

/**
 * Engine sesi Latihan Kalimat Rumpang dengan behaviour interaksi Duolingo & Loop Revisi
 */
export class SentenceFillGapSessionEngine {
  private mainQueue: SentenceFillGapQuestion[];
  private retryQueue: SentenceFillGapQuestion[] = [];
  private currentQuestionItem: SentenceFillGapQuestion | null = null;
  private firstAttemptResults = new Map<string, boolean>();

  // State interaktif slot & chip untuk soal yang sedang aktif
  private currentSlots: (FillGapChip | null)[] = [];
  private availablePoolChips: FillGapChip[] = [];

  constructor(questions: SentenceFillGapQuestion[]) {
    this.mainQueue = [...questions];
    this.advanceNext();
  }

  getCurrentQuestion(): SentenceFillGapQuestion | null {
    return this.currentQuestionItem;
  }

  getCurrentSlots(): (FillGapChip | null)[] {
    return this.currentSlots;
  }

  getAvailablePoolChips(): FillGapChip[] {
    return this.availablePoolChips;
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

  isAllSlotsFilled(): boolean {
    if (this.currentSlots.length === 0) return false;
    return this.currentSlots.every((slot) => slot !== null);
  }

  /**
   * Behaviour Duolingo: Mengetuk chip pada pool memasukkannya ke slot kosong pertama
   */
  placeChipInFirstEmptySlot(chipId: string): boolean {
    const chipIdx = this.availablePoolChips.findIndex((c) => c.id === chipId);
    if (chipIdx === -1) return false;

    // Cari slot kosong pertama
    const firstEmptyIdx = this.currentSlots.findIndex((slot) => slot === null);
    if (firstEmptyIdx === -1) return false; // Semua slot sudah penuh

    const [chip] = this.availablePoolChips.splice(chipIdx, 1);
    this.currentSlots[firstEmptyIdx] = chip;
    return true;
  }

  /**
   * Behaviour Duolingo: Mengetuk chip di dalam slot mengembalikannya ke pool pilihan
   */
  removeChipFromSlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.currentSlots.length) return false;
    const chip = this.currentSlots[slotIndex];
    if (!chip) return false;

    this.currentSlots[slotIndex] = null;
    this.availablePoolChips.push(chip);
    return true;
  }

  /**
   * Evaluasi jawaban pengguna
   */
  submitAnswer(): {
    isCorrect: boolean;
    fullSentenceText: string;
    explanation: string;
  } {
    const q = this.currentQuestionItem;
    if (!q) {
      throw new Error('Tidak ada kalimat rumpang aktif.');
    }

    if (!this.isAllSlotsFilled()) {
      throw new Error('Seluruh slot rumpang harus diisi terlebih dahulu.');
    }

    // Periksa apakah urutan teks chip pada slot sama persis dengan correctTokens
    const userWords = this.currentSlots.map(
      (slot) => slot?.text.toLowerCase() || '',
    );
    const expectedWords = q.correctTokens.map((ct) => ct.toLowerCase());

    const isCorrect =
      userWords.length === expectedWords.length &&
      userWords.every((w, i) => w === expectedWords[i]);

    // Catat statistik jika ini adalah percobaan pertama
    if (!q.isRetry && !this.firstAttemptResults.has(q.sentenceId)) {
      this.firstAttemptResults.set(q.sentenceId, isCorrect);
    }

    // Jika salah, masukkan ke antrean revisi (Opsi 1: Loop Soal Salah di Akhir)
    if (!isCorrect) {
      const retryQuestion: SentenceFillGapQuestion = {
        ...q,
        isRetry: true,
      };
      this.retryQueue.push(retryQuestion);
    }

    const explanation = `"${q.fullText}" artinya ${q.translation}`;

    return {
      isCorrect,
      fullSentenceText: q.fullText,
      explanation,
    };
  }

  /**
   * Melangkah ke soal berikutnya dalam antrean
   */
  advanceNext(): SentenceFillGapQuestion | null {
    let nextQ: SentenceFillGapQuestion | null = null;

    if (this.mainQueue.length > 0) {
      nextQ = this.mainQueue.shift() ?? null;
    } else if (this.retryQueue.length > 0) {
      nextQ = this.retryQueue.shift() ?? null;
    }

    this.currentQuestionItem = nextQ;

    if (nextQ) {
      // Inisialisasi slot kosong sesuai blankCount
      this.currentSlots = new Array(nextQ.blankCount).fill(null);
      this.availablePoolChips = [...nextQ.poolChips];
    } else {
      this.currentSlots = [];
      this.availablePoolChips = [];
    }

    return nextQ;
  }

  getStats(): SentenceFillGapStats {
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
