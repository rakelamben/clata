import { describe, expect, it } from 'vitest';

import type { SentenceItem, WordItem } from '../../../src/domain/package/packageTypes';
import {
  createWordGuessQuestion,
  findExampleSentence,
  WordGuessSessionEngine,
} from '../../../src/features/practice/domain/wordGuessEngine';

describe('wordGuessEngine', () => {
  const sampleWords: WordItem[] = [
    {
      id: 'kata-sare',
      text: 'sare',
      meaning: 'tidur',
      part_of_speech: 'verb',
      register: 'sopan',
      theme: 'activity',
      unit_id: 'unit-1',
      audio: 'audio/kata-sugeng.opus',
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
      id: 'kata-ngunjuk',
      text: 'ngunjuk',
      meaning: 'minum',
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
      translation: 'Bapak sedang tidur di kamar',
      word_ids: ['kata-sare', 'kata-bapak'],
      focus_word_id: 'kata-sare',
      register: 'sopan',
      unit_id: 'unit-1',
      audio: '',
      status: 'poc',
    },
  ];

  it('finds matching example sentence for a word', () => {
    const example = findExampleSentence('kata-sare', sampleSentences);
    expect(example).toBe('bapak nembe sare wonten kamar');

    const notFound = findExampleSentence('kata-nonexistent', sampleSentences);
    expect(notFound).toBeUndefined();
  });

  it('creates question with 2 options (A, B) when forced to 2', () => {
    const question = createWordGuessQuestion(
      sampleWords[0],
      sampleSentences,
      sampleWords,
      2,
    );
    expect(question.options.length).toBe(2);
    expect(question.options.map((o) => o.label)).toEqual(['A', 'B']);
    expect(question.options.some((o) => o.isCorrect)).toBe(true);
    expect(question.exampleSentence).toBe('bapak nembe sare wonten kamar');
  });

  it('creates question with 3 options (A, B, C) when forced to 3', () => {
    const question = createWordGuessQuestion(
      sampleWords[0],
      sampleSentences,
      sampleWords,
      3,
    );
    expect(question.options.length).toBe(3);
    expect(question.options.map((o) => o.label)).toEqual(['A', 'B', 'C']);
    expect(question.options.some((o) => o.isCorrect)).toBe(true);
  });

  it('manages session flow and loops wrong answers at the end (Opsi 1)', () => {
    const q1 = createWordGuessQuestion(sampleWords[0], sampleSentences, sampleWords, 2);
    const q2 = createWordGuessQuestion(sampleWords[1], sampleSentences, sampleWords, 2);

    const engine = new WordGuessSessionEngine([q1, q2]);

    expect(engine.isCompleted()).toBe(false);
    expect(engine.isRetryPhase()).toBe(false);
    expect(engine.getCurrentQuestion()?.wordId).toBe('kata-sare');

    // Answer Q1 WRONGLY
    const wrongOptId = q1.options.find((o) => !o.isCorrect)?.id ?? 'wrong';
    const eval1 = engine.submitAnswer(wrongOptId);
    expect(eval1.isCorrect).toBe(false);
    expect(eval1.explanation).toContain('sare berarti tidur');

    // Advance to Q2
    const nextQ = engine.advanceNext();
    expect(nextQ?.wordId).toBe('kata-mangan');
    expect(engine.isRetryPhase()).toBe(false);

    // Answer Q2 CORRECTLY
    const correctOptId = q2.options.find((o) => o.isCorrect)?.id ?? 'correct';
    const eval2 = engine.submitAnswer(correctOptId);
    expect(eval2.isCorrect).toBe(true);

    // Advance -> Should enter RETRY PHASE for Q1
    const retryQ = engine.advanceNext();
    expect(retryQ?.wordId).toBe('kata-sare');
    expect(engine.isRetryPhase()).toBe(true);

    // Answer retry Q1 CORRECTLY
    const correctOptIdRetry = retryQ?.options.find((o) => o.isCorrect)?.id ?? '';
    const evalRetry = engine.submitAnswer(correctOptIdRetry);
    expect(evalRetry.isCorrect).toBe(true);

    // Advance -> Selesai
    const finished = engine.advanceNext();
    expect(finished).toBeNull();
    expect(engine.isCompleted()).toBe(true);

    // Verify stats: 1 correct on first try, 1 wrong on first try -> 50% accuracy
    const stats = engine.getStats();
    expect(stats.totalQuestions).toBe(2);
    expect(stats.firstAttemptCorrect).toBe(1);
    expect(stats.firstAttemptWrong).toBe(1);
    expect(stats.accuracyPercentage).toBe(50);
  });
});
