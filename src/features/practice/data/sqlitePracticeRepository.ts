import { createAppError } from '../../../domain/errors/AppError';
import type { Clock } from '../../../domain/ports/Clock';
import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { SQLiteProgressRepository } from '../../progress/data/progressRepository';
import { validatePracticeQuestion } from '../domain/questionValidation';
import { canCompletePracticeSession } from '../domain/practiceSession';
import { clampPracticeQuestionCount } from '../domain/practiceRules';
import { pickPracticeWords } from '../domain/contentPicker';
import type { FillTheGapQuestion, GuessTheWordQuestion, PracticeQuestion, PracticeRepository, PracticeSession, PracticeWordCandidate, GuessTheWordDirection } from '../domain/practiceTypes';

type WordRow = { package_id: string; item_id: string; unit_id: string; item_order: number; unit_order: number; register: string; payload_json: string; strength?: number; last_result?: number };
type SentenceRow = { package_id: string; item_id: string; unit_id: string; item_order: number; unit_order: number; payload_json: string };

function errorResult<T>(message: string): RepositoryResult<T> { return { ok: false, error: createAppError('UNKNOWN', message, { recoverable: true }) }; }
function id(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
function audio(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.path !== 'string' || !['opus', 'm4a', 'aac'].includes(String(candidate.format)) || Number(candidate.durationMs) <= 0 || Number(candidate.channels) <= 0 || Number(candidate.sampleRateHz) <= 0) return null;
  return { path: candidate.path, format: candidate.format as 'opus' | 'm4a' | 'aac', durationMs: Number(candidate.durationMs), channels: Number(candidate.channels), sampleRateHz: Number(candidate.sampleRateHz), status: candidate.status === 'verified' ? 'verified' as const : 'unavailable' as const };
}

export class SQLitePracticeRepository implements PracticeRepository {
  constructor(private readonly database: DatabasePort, private readonly progress: SQLiteProgressRepository, private readonly clock: Clock, private readonly deviceId: string) {}

  private async words(packageId: string, unitId?: string): Promise<PracticeWordCandidate[]> {
    const rows = await this.database.all<WordRow>('SELECT words.package_id, words.item_id, words.unit_id, words.item_order, units.unit_order, words.register, words.payload_json, item_strength_cache.strength, item_strength_cache.last_result FROM words JOIN units ON units.package_id = words.package_id AND units.item_id = words.unit_id LEFT JOIN item_strength_cache ON item_strength_cache.package_id = words.package_id AND item_strength_cache.item_id = words.item_id AND item_strength_cache.item_type = ? JOIN installed_packages ON installed_packages.package_id = words.package_id AND installed_packages.install_state = ? WHERE words.package_id = ? AND (? IS NULL OR words.unit_id = ?) ORDER BY units.unit_order, words.item_order, words.item_id', ['word', 'active', packageId, unitId ?? null, unitId ?? null]);
    return rows.flatMap((row) => {
      try {
        const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
        if (typeof payload.text !== 'string' || typeof payload.meaning !== 'string' || payload.status === 'draft') return [];
        return [{ packageId: row.package_id, id: row.item_id, unitId: row.unit_id, unitOrder: Number(row.unit_order), itemOrder: Number(row.item_order), lemma: payload.text, meaning: payload.meaning, register: row.register, partOfSpeech: typeof payload.part_of_speech === 'string' ? payload.part_of_speech : undefined, theme: typeof payload.theme === 'string' ? payload.theme : undefined, audio: audio(payload.audio), strength: row.strength == null ? undefined : Number(row.strength), lastResult: row.last_result == null ? undefined : Number(row.last_result) }];
      } catch { return []; }
    });
  }

  private async exampleSentence(packageId: string, targetItemId: string): Promise<{ sentenceId: string; text: string; translation?: string } | undefined> {
    const rows = await this.database.all<{ item_id: string; payload_json: string }>('SELECT sentences.item_id, sentences.payload_json FROM sentences JOIN installed_packages ON installed_packages.package_id = sentences.package_id AND installed_packages.install_state = ? WHERE sentences.package_id = ? ORDER BY sentences.item_order, sentences.item_id', ['active', packageId]);
    for (const row of rows) {
      try {
        const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
        const ids = Array.isArray(payload.word_ids) ? payload.word_ids.map(String) : [];
        if (ids.includes(targetItemId) && typeof payload.text === 'string') return { sentenceId: row.item_id, text: payload.text, translation: typeof payload.translation === 'string' ? payload.translation : undefined };
      } catch { /* malformed examples are skipped */ }
    }
    return undefined;
  }

  private async buildQuestion(packageId: string, exerciseType: 'guess_the_word' | 'fill_the_gap', direction: GuessTheWordDirection, unitId: string | undefined, index: number): Promise<PracticeQuestion | null> {
    const candidates = await this.words(packageId, unitId);
    if (exerciseType === 'guess_the_word') {
      const ordered = pickPracticeWords(candidates, { packageId, unitId, count: candidates.length, seed: `${packageId}:${direction}`, today: this.clock.now().toISOString().slice(0, 10) });
      const target = ordered[index % Math.max(ordered.length, 1)];
      if (!target) return null;
      const pool = ordered.filter((candidate) => candidate.id !== target.id && candidate.meaning !== target.meaning).slice(0, 3);
      if (pool.length < 3 || direction === 'audio_to_meaning' && target.audio?.status !== 'verified') return null;
      const options = [target, ...pool].map((candidate) => ({ optionId: candidate.id, itemId: candidate.id, packageId, label: direction === 'meaning_to_word' ? candidate.lemma : candidate.meaning }));
      const question: GuessTheWordQuestion = { type: 'guess_the_word', questionId: `guess-${target.id}-${index}`, packageId, targetItemId: target.id, direction, prompt: direction === 'word_to_meaning' ? { lemma: target.lemma } : direction === 'meaning_to_word' ? { meaning: target.meaning } : { audio: target.audio ?? undefined }, options, correctOptionId: target.id, exampleSentence: await this.exampleSentence(packageId, target.id) };
      return validatePracticeQuestion(question).ok ? question : null;
    }
    const sentences = await this.database.all<SentenceRow>('SELECT package_id, item_id, unit_id, item_order, units.unit_order, payload_json FROM sentences JOIN units ON units.package_id = sentences.package_id AND units.item_id = sentences.unit_id JOIN installed_packages ON installed_packages.package_id = sentences.package_id AND installed_packages.install_state = ? WHERE sentences.package_id = ? AND (? IS NULL OR sentences.unit_id = ?) ORDER BY units.unit_order, sentences.item_order, sentences.item_id', ['active', packageId, unitId ?? null, unitId ?? null]);
    let validIndex = 0;
    for (const sentence of sentences) {
    try {
      const payload = JSON.parse(sentence.payload_json) as Record<string, unknown>;
      if (payload.status === 'draft' || typeof payload.text !== 'string' || typeof payload.translation !== 'string' || typeof payload.gap !== 'string' || (payload.text.match(/___/g) ?? []).length !== 1) continue;
      const beforeGap = payload.text.split('___')[0] ?? '';
      const afterGap = payload.text.split('___').slice(1).join('___');
      const wordBank = await this.words(packageId, unitId);
      const targetWord = wordBank.find((candidate) => candidate.id === String(payload.gap));
      if (!targetWord) continue;
      const compatible = wordBank.filter((candidate) => candidate.id !== targetWord.id && candidate.partOfSpeech === targetWord.partOfSpeech && candidate.register === targetWord.register);
      const fallback = wordBank.filter((candidate) => candidate.id !== targetWord.id && !compatible.some((item) => item.id === candidate.id));
      const options = [targetWord, ...compatible, ...fallback].slice(0, 4);
      if (options.length < 3) continue;
      const question: FillTheGapQuestion = { type: 'fill_the_gap', questionId: `gap-${sentence.item_id}`, packageId, sentenceId: sentence.item_id, missingWordId: String(payload.gap), beforeGap, afterGap, translation: payload.translation, gapCount: payload.text.split('___').length - 1, options: options.map((candidate) => ({ optionId: candidate.id, itemId: candidate.id, packageId, label: candidate.lemma })), correctOptionId: String(payload.gap), audio: audio(payload.audio) ?? undefined };
      if (validatePracticeQuestion(question).ok) { if (validIndex === index) return question; validIndex += 1; }
    } catch { /* malformed sentences are skipped */ }
    }
    return null;
  }

  async getUnits(packageId: string): Promise<RepositoryResult<{ id: string; title: string; order: number }[]>> { try { const rows = await this.database.all<{ item_id: string; title: string; unit_order: number }>('SELECT units.item_id, units.title, units.unit_order FROM units JOIN installed_packages ON installed_packages.package_id = units.package_id AND installed_packages.install_state = ? WHERE units.package_id = ? ORDER BY units.unit_order, units.item_id', ['active', packageId]); return { ok: true, data: rows.map((row) => ({ id: row.item_id, title: row.title, order: Number(row.unit_order) })) }; } catch { return errorResult('Unit latihan belum dapat dibaca.'); } }
  async getAvailability(packageId: string, exerciseType: 'guess_the_word' | 'fill_the_gap', unitId?: string, direction?: GuessTheWordDirection): Promise<RepositoryResult<{ available: boolean; reason?: string; count: number }>> {
    try {
      if (exerciseType === 'guess_the_word') {
        const candidates = await this.words(packageId, unitId);
        const count = direction === 'audio_to_meaning' ? candidates.filter((word) => word.audio?.status === 'verified').length : candidates.length;
        return { ok: true, data: { available: count >= 4, count, reason: count < 4 ? 'Belum ada cukup materi untuk membuat empat pilihan.' : undefined } };
      }
      const question = await this.buildQuestion(packageId, exerciseType, 'word_to_meaning', unitId, 0);
      return { ok: true, data: { available: Boolean(question), count: question ? 1 : 0, reason: question ? undefined : 'Belum ada kalimat yang cukup untuk latihan.' } };
    } catch { return errorResult('Ketersediaan latihan belum dapat dibaca.'); }
  }

  async createSession(input: { packageId: string; exerciseType: 'guess_the_word' | 'fill_the_gap'; unitId?: string; questionCount: number; direction?: GuessTheWordDirection }): Promise<RepositoryResult<PracticeSession>> {
    const count = clampPracticeQuestionCount(input.questionCount);
    const direction = input.direction ?? 'word_to_meaning';
    try {
      const questions: PracticeQuestion[] = [];
      for (let index = 0; index < count; index += 1) { const question = await this.buildQuestion(input.packageId, input.exerciseType, direction, input.unitId, index); if (question) questions.push(question); }
      if (!questions.length) return errorResult('Belum ada materi yang memenuhi latihan ini.');
      if (questions.length < count) return errorResult(`Materi valid hanya cukup untuk ${questions.length} soal. Pilih materi lain atau jumlah soal yang lebih kecil.`);
      const sessionId = id('practice');
      const startedAt = this.clock.now().toISOString();
      const session: PracticeSession = { sessionId, packageId: input.packageId, exerciseType: input.exerciseType, unitId: input.unitId, direction: input.direction, questionIds: questions.map((question) => question.questionId), questionCount: questions.length, currentIndex: 0, answeredCount: 0, correctCount: 0, status: 'active', startedAt };
      const startEvent = { eventId: `practice:${sessionId}:started`, localSequence: 0, deviceId: this.deviceId, packageId: input.packageId, eventType: 'session_started' as const, source: 'system' as const, weight: 1 as const, sessionId, deviceTime: startedAt, localDate: startedAt.slice(0, 10), formulaVersion: 1, payload: { sessionId, exerciseType: input.exerciseType, questionCount: questions.length, completed: false } };
      await this.database.transaction(async (transaction) => {
        await transaction.run('INSERT INTO practice_sessions(session_id, package_id, exercise_type, unit_id, direction, question_count, status, started_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [session.sessionId, session.packageId, session.exerciseType, session.unitId ?? null, session.direction ?? null, session.questionCount, session.status, session.startedAt]);
        for (const [index, question] of questions.entries()) await transaction.run('INSERT INTO practice_questions(session_id, question_index, question_id, question_type, target_item_id, sentence_id, question_json) VALUES (?, ?, ?, ?, ?, ?, ?)', [session.sessionId, index, question.questionId, question.type, question.type === 'guess_the_word' ? question.targetItemId : question.missingWordId, question.type === 'fill_the_gap' ? question.sentenceId : null, JSON.stringify(question)]);
        const eventResult = await this.progress.appendEventWithin(transaction, startEvent);
        if (!eventResult.ok) throw eventResult.error;
      });
      return { ok: true, data: session };
    } catch { return errorResult('Sesi latihan belum dapat dibuat.'); }
  }

  async getSession(sessionId: string): Promise<RepositoryResult<PracticeSession | null>> { try { const row = await this.database.get<Record<string, unknown>>('SELECT * FROM practice_sessions WHERE session_id = ?', [sessionId]); return { ok: true, data: row ? await this.hydrateSession(row) : null }; } catch { return errorResult('Sesi latihan belum dapat dibaca.'); } }
  async getInterruptedSession(packageId: string): Promise<RepositoryResult<PracticeSession | null>> { try { const row = await this.database.get<Record<string, unknown>>('SELECT * FROM practice_sessions WHERE package_id = ? AND status IN (?, ?) ORDER BY started_at DESC LIMIT 1', [packageId, 'active', 'interrupted']); return { ok: true, data: row ? await this.hydrateSession(row) : null }; } catch { return errorResult('Sesi terakhir belum dapat dibaca.'); } }
  async getQuestion(sessionId: string, index: number): Promise<RepositoryResult<PracticeQuestion | null>> { try { const row = await this.database.get<{ question_json: string }>('SELECT question_json FROM practice_questions WHERE session_id = ? AND question_index = ?', [sessionId, index]); return { ok: true, data: row ? JSON.parse(row.question_json) as PracticeQuestion : null }; } catch { return errorResult('Soal latihan belum dapat dibaca.'); } }

  async submitAnswer(input: { sessionId: string; questionId: string; optionId: string }): Promise<RepositoryResult<{ correct: boolean; correctOptionId: string; answerLabel: string; nextIndex: number; sessionCompleted: boolean }>> {
    try {
      let persistedAnswer: { correct: boolean; selectedOptionId: string } | null = null;
      const sessionRow = await this.database.get<Record<string, unknown>>('SELECT * FROM practice_sessions WHERE session_id = ?', [input.sessionId]);
      if (!sessionRow) return errorResult('Sesi latihan tidak ditemukan.');
      if (sessionRow.status !== 'active') return errorResult('Sesi latihan sudah tidak aktif.');
      const questionRow = await this.database.get<{ question_json: string; question_index: number; answered: number; selected_option_id: string | null; correct: number | null }>('SELECT question_json, question_index, answered, selected_option_id, correct FROM practice_questions WHERE session_id = ? AND question_id = ?', [input.sessionId, input.questionId]);
      if (!questionRow) return errorResult('Soal latihan tidak ditemukan.');
      const question = JSON.parse(questionRow.question_json) as PracticeQuestion;
      if (String(sessionRow.package_id) !== question.packageId) return errorResult('Package sesi tidak sesuai.');
      const option = question.options.find((candidate) => candidate.optionId === input.optionId);
      if (!option) return errorResult('Pilihan jawaban tidak valid.');
      const correct = option.optionId === question.correctOptionId;
      if (questionRow.answered) {
        if (questionRow.selected_option_id !== input.optionId) return errorResult('Soal ini sudah dijawab dengan pilihan lain.');
        const updated = await this.database.get<{ answered_count: number; question_count: number }>('SELECT answered_count, question_count FROM practice_sessions WHERE session_id = ?', [input.sessionId]);
        return { ok: true, data: { correct: Number(questionRow.correct) === 1, correctOptionId: question.correctOptionId, answerLabel: question.options.find((candidate) => candidate.optionId === question.correctOptionId)?.label ?? '', nextIndex: Number(updated?.answered_count ?? 0), sessionCompleted: Boolean(updated && canCompletePracticeSession({ questionCount: Number(updated.question_count), answeredCount: Number(updated.answered_count) })) } };
      }
      if (Number(sessionRow.current_index) !== Number(questionRow.question_index)) return errorResult('Urutan soal sesi tidak valid.');
      {
        const now = this.clock.now();
        const event = { eventId: `practice:${input.sessionId}:${input.questionId}`, localSequence: 0, deviceId: this.deviceId, packageId: question.packageId, itemId: question.type === 'guess_the_word' ? question.targetItemId : question.missingWordId, eventType: 'practice_answered' as const, source: 'practice' as const, result: correct ? 1 : 0, weight: 1 as const, sessionId: input.sessionId, deviceTime: now.toISOString(), localDate: now.toISOString().slice(0, 10), formulaVersion: 1, payload: { sessionId: input.sessionId, questionId: input.questionId, exerciseType: question.type, targetItemId: question.type === 'guess_the_word' ? question.targetItemId : question.missingWordId, answerId: input.optionId, correct } };
        await this.database.transaction(async (transaction) => { const current = await transaction.get<{ answered: number; selected_option_id: string | null; correct: number | null }>('SELECT answered, selected_option_id, correct FROM practice_questions WHERE session_id = ? AND question_id = ?', [input.sessionId, input.questionId]); if (current?.answered) { persistedAnswer = { correct: current.correct === 1, selectedOptionId: String(current.selected_option_id) }; return; } const eventAlreadyExists = await transaction.get<{ event_id: string }>('SELECT event_id FROM learning_events WHERE event_id = ?', [event.eventId]); if (eventAlreadyExists) return; const eventResult = await this.progress.appendEventWithin(transaction, event); if (!eventResult.ok) throw eventResult.error; await transaction.run('UPDATE practice_questions SET answered = 1, selected_option_id = ?, correct = ? WHERE session_id = ? AND question_id = ?', [input.optionId, correct ? 1 : 0, input.sessionId, input.questionId]); await transaction.run('UPDATE practice_sessions SET answered_count = answered_count + 1, correct_count = correct_count + ?, current_index = current_index + 1 WHERE session_id = ?', [correct ? 1 : 0, input.sessionId]); });
        const replayedAnswer = persistedAnswer as { correct: boolean; selectedOptionId: string } | null;
        if (replayedAnswer) {
          if (replayedAnswer.selectedOptionId !== input.optionId) return errorResult('Soal ini sudah dijawab dengan pilihan lain.');
          const updatedExisting = await this.database.get<{ answered_count: number; question_count: number }>('SELECT answered_count, question_count FROM practice_sessions WHERE session_id = ?', [input.sessionId]);
          return { ok: true, data: { correct: replayedAnswer.correct, correctOptionId: question.correctOptionId, answerLabel: question.options.find((candidate) => candidate.optionId === question.correctOptionId)?.label ?? '', nextIndex: Number(updatedExisting?.answered_count ?? 0), sessionCompleted: Boolean(updatedExisting && canCompletePracticeSession({ questionCount: Number(updatedExisting.question_count), answeredCount: Number(updatedExisting.answered_count) })) } };
        }
      }
      const updated = await this.database.get<{ answered_count: number; question_count: number }>('SELECT answered_count, question_count FROM practice_sessions WHERE session_id = ?', [input.sessionId]);
      return { ok: true, data: { correct, correctOptionId: question.correctOptionId, answerLabel: question.options.find((candidate) => candidate.optionId === question.correctOptionId)?.label ?? '', nextIndex: Number(updated?.answered_count ?? 0), sessionCompleted: Boolean(updated && canCompletePracticeSession({ questionCount: Number(updated.question_count), answeredCount: Number(updated.answered_count) })) } };
    } catch { return errorResult('Jawaban belum tersimpan.'); }
  }

  async completeSession(sessionId: string): Promise<RepositoryResult<void>> { try { const row = await this.database.get<{ package_id: string; exercise_type: string; question_count: number; correct_count: number; answered_count: number; status: string }>('SELECT * FROM practice_sessions WHERE session_id = ?', [sessionId]); if (!row || row.status === 'completed') return { ok: true, data: undefined }; if (!canCompletePracticeSession({ questionCount: Number(row.question_count), answeredCount: Number(row.answered_count) })) return errorResult('Semua soal belum dijawab.'); const now = this.clock.now(); const event = { eventId: `practice:${sessionId}:completed`, localSequence: 0, deviceId: this.deviceId, packageId: row.package_id, eventType: 'session_completed' as const, source: 'system' as const, weight: 1 as const, sessionId, deviceTime: now.toISOString(), localDate: now.toISOString().slice(0, 10), formulaVersion: 1, payload: { sessionId, exerciseType: row.exercise_type, questionCount: row.question_count, correctCount: row.correct_count, completed: true } }; await this.database.transaction(async (transaction) => { const eventResult = await this.progress.appendEventWithin(transaction, event); if (!eventResult.ok) throw eventResult.error; await transaction.run('UPDATE practice_sessions SET status = ?, completed_at = ? WHERE session_id = ?', ['completed', now.toISOString(), sessionId]); }); return { ok: true, data: undefined }; } catch { return errorResult('Sesi belum dapat diselesaikan.'); } }
  async abandonSession(sessionId: string): Promise<RepositoryResult<void>> { try { const row = await this.database.get<{ status: string }>('SELECT status FROM practice_sessions WHERE session_id = ?', [sessionId]); if (!row || !['active', 'interrupted', 'created'].includes(row.status)) return errorResult('Sesi aktif tidak ditemukan.'); const result = await this.database.run('UPDATE practice_sessions SET status = ? WHERE session_id = ? AND status IN (?, ?, ?)', ['abandoned', sessionId, 'active', 'interrupted', 'created']); if (result.changes !== 1) return errorResult('Sesi aktif belum dapat ditutup.'); return { ok: true, data: undefined }; } catch { return errorResult('Sesi belum dapat ditutup.'); } }

  private mapSession(row: Record<string, unknown>): PracticeSession { return { sessionId: String(row.session_id), packageId: String(row.package_id), exerciseType: row.exercise_type as PracticeSession['exerciseType'], unitId: row.unit_id == null ? undefined : String(row.unit_id), direction: row.direction == null ? undefined : row.direction as GuessTheWordDirection, questionIds: [], questionCount: Number(row.question_count), currentIndex: Number(row.current_index), answeredCount: Number(row.answered_count), correctCount: Number(row.correct_count), status: row.status as PracticeSession['status'], startedAt: String(row.started_at), completedAt: row.completed_at == null ? undefined : String(row.completed_at) }; }
  private async hydrateSession(row: Record<string, unknown>): Promise<PracticeSession> { const session = this.mapSession(row); const questions = await this.database.all<{ question_id: string }>('SELECT question_id FROM practice_questions WHERE session_id = ? ORDER BY question_index', [session.sessionId]); return { ...session, questionIds: questions.map((question) => question.question_id) }; }
}
