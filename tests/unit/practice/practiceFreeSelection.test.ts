import { describe, expect, it } from 'vitest';
import type { DialogueItem, SentenceItem, WordItem } from '../../../src/domain/package/packageTypes';
import {
  generateQuickQuizItems,
  selectFreeDialogue,
  selectFreeFillGapItems,
  selectFreeWordGuessItems,
} from '../../../src/features/practice/domain/practiceFreeSelection';

describe('practiceFreeSelection', () => {
  const dummyWords: WordItem[] = Array.from({ length: 15 }, (_, i) => ({
    id: `w_${i + 1}`,
    text: `Tembung ${i + 1}`,
    meaning: `Arti ${i + 1}`,
    part_of_speech: 'noun',
    register: 'netral',
    theme: 'umum',
    unit_id: 'unit_1',
    audio: `audio/w_${i + 1}.opus`,
    status: 'published',
  }));

  const dummySentences: SentenceItem[] = Array.from({ length: 12 }, (_, i) => ({
    id: `s_${i + 1}`,
    text: `Ukara nomer ${i + 1} ing basa Jawa.`,
    translation: `Kalimat nomor ${i + 1} dalam bahasa Indonesia.`,
    focus_word_id: `w_${(i % 15) + 1}`,
    word_ids: [`w_${(i % 15) + 1}`],
    register: 'netral',
    unit_id: 'unit_1',
    audio: `audio/s_${i + 1}.opus`,
    status: 'published',
  }));

  const dummyDialogues: DialogueItem[] = [
    {
      id: 'd_1',
      title: 'Pacelathon 1',
      interlocutor: 'Partner 1',
      unit_id: 'unit_1',
      register: 'netral',
      nodes: [],
      endings: [],
    },
    {
      id: 'd_2',
      title: 'Pacelathon 2',
      interlocutor: 'Partner 2',
      unit_id: 'unit_2',
      register: 'sopan',
      nodes: [],
      endings: [],
    },
  ];

  describe('selectFreeWordGuessItems', () => {
    it('mengambil jumlah kata sesuai limit default 10 dari total 15 kata', () => {
      const selected = selectFreeWordGuessItems(dummyWords);
      expect(selected).toHaveLength(10);
      selected.forEach((word) => {
        expect(dummyWords.some((w) => w.id === word.id)).toBe(true);
      });
    });

    it('mengembalikan seluruh kata jika jumlah kata kurang dari limit', () => {
      const smallWords = dummyWords.slice(0, 3);
      const selected = selectFreeWordGuessItems(smallWords, 10);
      expect(selected).toHaveLength(3);
    });

    it('menangani list kosong', () => {
      const selected = selectFreeWordGuessItems([]);
      expect(selected).toEqual([]);
    });
  });

  describe('selectFreeFillGapItems', () => {
    it('mengambil jumlah kalimat sesuai limit default 8 dari total 12 kalimat', () => {
      const selected = selectFreeFillGapItems(dummySentences);
      expect(selected).toHaveLength(8);
      selected.forEach((sentence) => {
        expect(dummySentences.some((s) => s.id === sentence.id)).toBe(true);
      });
    });

    it('mengembalikan seluruh kalimat jika jumlah kalimat kurang dari limit', () => {
      const smallSentences = dummySentences.slice(0, 4);
      const selected = selectFreeFillGapItems(smallSentences, 8);
      expect(selected).toHaveLength(4);
    });

    it('menangani list kosong', () => {
      const selected = selectFreeFillGapItems([]);
      expect(selected).toEqual([]);
    });
  });

  describe('selectFreeDialogue', () => {
    it('mengembalikan null jika list dialog kosong', () => {
      expect(selectFreeDialogue([])).toBeNull();
    });

    it('memilih salah satu dialog yang valid secara acak', () => {
      const selected = selectFreeDialogue(dummyDialogues);
      expect(selected).not.toBeNull();
      expect(['d_1', 'd_2']).toContain(selected?.id);
    });
  });

  describe('generateQuickQuizItems', () => {
    it('menghasilkan 10 soal campuran (5 tebak kata + 5 kalimat rumpang)', () => {
      const items = generateQuickQuizItems(dummyWords, dummySentences, 5, 5);
      expect(items).toHaveLength(10);

      const wordGuessItems = items.filter((i) => i.type === 'word_guess');
      const fillGapItems = items.filter((i) => i.type === 'fill_gap');

      expect(wordGuessItems).toHaveLength(5);
      expect(fillGapItems).toHaveLength(5);
    });

    it('mengembalikan array kosong jika words dan sentences kosong', () => {
      const items = generateQuickQuizItems([], []);
      expect(items).toEqual([]);
    });
  });
});
