import { describe, expect, it } from 'vitest';

import type { SentenceItem, WordItem } from '../../../src/domain/package/packageTypes';
import {
  createFillGapQuestion,
  SentenceFillGapSessionEngine,
} from '../../../src/features/practice/domain/sentenceFillGapEngine';

describe('sentenceFillGapEngine', () => {
  const sampleWords: WordItem[] = [
    {
      id: 'kata-bapak',
      text: 'bapak',
      meaning: 'ayah',
      part_of_speech: 'noun',
      register: 'sopan',
      theme: 'people',
      unit_id: 'unit-1',
      audio: '',
      status: 'poc',
    },
    {
      id: 'kata-sare',
      text: 'sare',
      meaning: 'tidur',
      part_of_speech: 'verb',
      register: 'sopan',
      theme: 'activity',
      unit_id: 'unit-1',
      audio: '',
      status: 'poc',
    },
    {
      id: 'kata-kamar',
      text: 'kamar',
      meaning: 'kamar',
      part_of_speech: 'noun',
      register: 'sopan',
      theme: 'place',
      unit_id: 'unit-1',
      audio: '',
      status: 'poc',
    },
    {
      id: 'kata-mangan',
      text: 'mangan',
      meaning: 'makan',
      part_of_speech: 'verb',
      register: 'akrab',
      theme: 'activity',
      unit_id: 'unit-1',
      audio: '',
      status: 'poc',
    },
    {
      id: 'kata-tindak',
      text: 'tindak',
      meaning: 'pergi',
      part_of_speech: 'verb',
      register: 'sopan',
      theme: 'activity',
      unit_id: 'unit-1',
      audio: '',
      status: 'poc',
    },
  ];

  const sampleSentences: SentenceItem[] = [
    {
      id: 'kalimat-01',
      text: 'bapak nembe sare wonten kamar',
      translation: 'Bapak sedang tidur di kamar.',
      word_ids: ['kata-bapak', 'kata-sare', 'kata-kamar'],
      focus_word_id: 'kata-sare',
      register: 'sopan',
      unit_id: 'unit-1',
      audio: 'audio/kalimat-sugeng.opus',
      status: 'poc',
    },
  ];

  it('creates fill-gap question with focus word as blank slot', () => {
    const question = createFillGapQuestion(sampleSentences[0], sampleWords, 1);
    expect(question.blankCount).toBe(1);
    expect(question.correctTokens).toContain('sare');
    expect(question.poolChips.some((c) => c.text === 'sare' && !c.isDistractor)).toBe(true);
    expect(question.poolChips.some((c) => c.isDistractor)).toBe(true);
    expect(question.translation).toBe('Bapak sedang tidur di kamar.');
  });

  it('manages Duolingo-style slot tapping (placing and removing chips)', () => {
    const question = createFillGapQuestion(sampleSentences[0], sampleWords, 1);
    const engine = new SentenceFillGapSessionEngine([question]);

    expect(engine.getCurrentSlots().length).toBe(1);
    expect(engine.getCurrentSlots()[0]).toBeNull();
    expect(engine.isAllSlotsFilled()).toBe(false);

    // Find correct chip in pool
    const correctChip = engine.getAvailablePoolChips().find((c) => c.text === 'sare');
    expect(correctChip).toBeDefined();

    // Tap chip -> places into slot 0
    const placed = engine.placeChipInFirstEmptySlot(correctChip!.id);
    expect(placed).toBe(true);
    expect(engine.getCurrentSlots()[0]?.text).toBe('sare');
    expect(engine.isAllSlotsFilled()).toBe(true);
    expect(engine.getAvailablePoolChips().some((c) => c.id === correctChip!.id)).toBe(false);

    // Tap slot 0 -> removes chip back to pool
    const removed = engine.removeChipFromSlot(0);
    expect(removed).toBe(true);
    expect(engine.getCurrentSlots()[0]).toBeNull();
    expect(engine.isAllSlotsFilled()).toBe(false);
    expect(engine.getAvailablePoolChips().some((c) => c.id === correctChip!.id)).toBe(true);
  });

  it('evaluates answers and handles retry loop for wrong sentences (Opsi 1)', () => {
    const question = createFillGapQuestion(sampleSentences[0], sampleWords, 1);
    const engine = new SentenceFillGapSessionEngine([question]);

    // Intentionally pick a distractor chip
    const distractorChip = engine.getAvailablePoolChips().find((c) => c.isDistractor);
    expect(distractorChip).toBeDefined();
    engine.placeChipInFirstEmptySlot(distractorChip!.id);

    // Submit wrong answer
    const evalWrong = engine.submitAnswer();
    expect(evalWrong.isCorrect).toBe(false);
    expect(evalWrong.explanation).toContain('Bapak sedang tidur di kamar');

    // Advance -> should enter retry phase
    const retryQ = engine.advanceNext();
    expect(retryQ).not.toBeNull();
    expect(engine.isRetryPhase()).toBe(true);

    // In retry phase, place correct chip
    const correctChip = engine.getAvailablePoolChips().find((c) => c.text === 'sare');
    expect(correctChip).toBeDefined();
    engine.placeChipInFirstEmptySlot(correctChip!.id);

    const evalCorrect = engine.submitAnswer();
    expect(evalCorrect.isCorrect).toBe(true);

    // Advance -> session complete
    const finished = engine.advanceNext();
    expect(finished).toBeNull();
    expect(engine.isCompleted()).toBe(true);

    const stats = engine.getStats();
    expect(stats.totalQuestions).toBe(1);
    expect(stats.firstAttemptCorrect).toBe(0);
    expect(stats.firstAttemptWrong).toBe(1);
    expect(stats.accuracyPercentage).toBe(0);
  });
});
