import { normalizeVocabularySearch } from '../../vocabulary/domain/searchNormalization';
import type { PracticeQuestion } from './practiceTypes';

export type QuestionValidationResult = { ok: true } | { ok: false; reason: 'EMPTY_OPTIONS' | 'DUPLICATE_OPTION' | 'AMBIGUOUS' | 'INVALID_TARGET' | 'INVALID_SENTENCE' | 'MISSING_METADATA' };

export function validatePracticeQuestion(question: PracticeQuestion): QuestionValidationResult {
  const expected = question.type === 'guess_the_word' ? 4 : 3;
  if (question.options.length < expected || question.options.length > 4) return { ok: false, reason: 'EMPTY_OPTIONS' };
  if (!question.options.some((option) => option.optionId === question.correctOptionId)) return { ok: false, reason: 'INVALID_TARGET' };
  if (new Set(question.options.map((option) => option.optionId)).size !== question.options.length) return { ok: false, reason: 'DUPLICATE_OPTION' };
  if (new Set(question.options.map((option) => option.itemId)).size !== question.options.length) return { ok: false, reason: 'DUPLICATE_OPTION' };
  if (question.options.some((option) => option.packageId && option.packageId !== question.packageId)) return { ok: false, reason: 'INVALID_TARGET' };
  const labels = question.options.map((option) => normalizeVocabularySearch(option.label));
  if (question.options.some((option) => !option.label.trim())) return { ok: false, reason: 'MISSING_METADATA' };
  if (new Set(labels).size !== labels.length) return { ok: false, reason: 'AMBIGUOUS' };
  const targetItemId = question.type === 'guess_the_word' ? question.targetItemId : question.missingWordId;
  if (question.options.find((option) => option.optionId === question.correctOptionId)?.itemId !== targetItemId) return { ok: false, reason: 'INVALID_TARGET' };
  if (question.options.some((option) => option.itemId === targetItemId && option.optionId !== question.correctOptionId)) return { ok: false, reason: 'INVALID_TARGET' };
  if (question.type === 'fill_the_gap' && (question.gapCount !== 1 || (!question.beforeGap && !question.afterGap) || !question.translation)) return { ok: false, reason: 'INVALID_SENTENCE' };
  if ((question.type === 'guess_the_word' && question.prompt.audio || question.type === 'fill_the_gap' && question.audio) && (question.type === 'guess_the_word' ? question.prompt.audio?.status : question.audio?.status) !== 'verified') return { ok: false, reason: 'MISSING_METADATA' };
  return { ok: true };
}
