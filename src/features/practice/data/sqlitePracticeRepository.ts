import { createAppError } from '../../../domain/errors/AppError';
import type { Clock } from '../../../domain/ports/Clock';
import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { SQLiteProgressRepository } from '../../progress/data/progressRepository';
import { updateStrength } from '../../../domain/progress/strength';
import { validatePracticeQuestion } from '../domain/questionValidation';
import { canCompletePracticeSession } from '../domain/practiceSession';
import { clampPracticeQuestionCount } from '../domain/practiceRules';
import { pickPracticeWords } from '../domain/contentPicker';
import type { FillTheGapQuestion, GuessTheWordQuestion, PracticeQuestion, PracticeRepository, PracticeSession, PracticeWordCandidate, GuessTheWordDirection, PracticeExerciseType, PracticeUnitInfo } from '../domain/practiceTypes';

type WordRow = { package_id: string; item_id: string; unit_id: string; item_order: number; unit_order: number; register: string; payload_json: string; strength?: number; last_result?: number; last_reviewed_at?: string; viewed?: number };
type SentenceRow = { package_id: string; item_id: string; unit_id: string; item_order: number; unit_order: number; payload_json: string };

function errorResult<T>(message: string): RepositoryResult<T> { return { ok: false, error: createAppError('UNKNOWN', message, { recoverable: true }) }; }
function id(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.floor(Math.random() * 1000000)}`; }
function hash(value: string): number { let result = 2166136261; for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619); return result >>> 0; }

function shuffle<T>(array: T[], seedValue: number): T[] {
  const copy = [...array];
  let current = seedValue;
  for (let i = copy.length - 1; i > 0; i--) {
    current = (current * 9301 + 49297) % 233280;
    const j = Math.floor((current / 233280) * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy;
}

function audio(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.path !== 'string' || !['opus', 'm4a', 'aac'].includes(String(candidate.format)) || Number(candidate.durationMs) <= 0 || Number(candidate.channels) <= 0 || Number(candidate.sampleRateHz) <= 0) return null;
  return { path: candidate.path, format: candidate.format as 'opus' | 'm4a' | 'aac', durationMs: Number(candidate.durationMs), channels: Number(candidate.channels), sampleRateHz: Number(candidate.sampleRateHz), status: candidate.status === 'verified' ? 'verified' as const : 'unavailable' as const };
}

export class SQLitePracticeRepository implements PracticeRepository {
  constructor(private readonly database: DatabasePort, private readonly progress: SQLiteProgressRepository, private readonly clock: Clock, private readonly deviceId: string) {}

  private async words(packageId: string, unitId?: string): Promise<PracticeWordCandidate[]> {
    const rows = await this.database.all<WordRow>(
      `SELECT words.package_id, words.item_id, words.unit_id, words.item_order, units.unit_order, words.register, words.payload_json, 
              item_strength_cache.strength, item_strength_cache.last_result, item_strength_cache.last_reviewed_at,
              CASE WHEN EXISTS (
                SELECT 1 FROM learning_events 
                WHERE learning_events.package_id = words.package_id 
                  AND learning_events.item_id = words.item_id 
                  AND learning_events.event_type = 'word_viewed'
              ) THEN 1 ELSE 0 END AS viewed
       FROM words 
       JOIN units ON units.package_id = words.package_id AND units.item_id = words.unit_id 
       LEFT JOIN item_strength_cache ON item_strength_cache.package_id = words.package_id AND item_strength_cache.item_id = words.item_id AND item_strength_cache.item_type = ? 
       JOIN installed_packages ON installed_packages.package_id = words.package_id AND installed_packages.install_state = ? 
       WHERE words.package_id = ? AND (? IS NULL OR words.unit_id = ?) 
       ORDER BY units.unit_order, words.item_order, words.item_id`,
      ['word', 'active', packageId, unitId ?? null, unitId ?? null]
    );
    return rows.flatMap((row) => {
      try {
        const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
        if (typeof payload.text !== 'string' || typeof payload.meaning !== 'string' || payload.status === 'draft') return [];
        return [{
          packageId: row.package_id,
          id: row.item_id,
          unitId: row.unit_id,
          unitOrder: Number(row.unit_order),
          itemOrder: Number(row.item_order),
          lemma: payload.text,
          meaning: payload.meaning,
          register: row.register,
          partOfSpeech: typeof payload.part_of_speech === 'string' ? payload.part_of_speech : undefined,
          theme: typeof payload.theme === 'string' ? payload.theme : undefined,
          audio: audio(payload.audio),
          strength: row.strength == null ? undefined : Number(row.strength),
          lastResult: row.last_result == null ? undefined : Number(row.last_result),
          lastReviewedAt: row.last_reviewed_at ? String(row.last_reviewed_at) : undefined,
          viewed: Boolean(row.viewed),
        }];
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

  private async buildQuestion(packageId: string, exerciseType: 'guess_the_word' | 'fill_the_gap', direction: GuessTheWordDirection, unitId: string | undefined, index: number, sessionSeed?: string): Promise<PracticeQuestion | null> {
    const candidates = await this.words(packageId, unitId);
    const sessionSalt = sessionSeed ?? `${this.clock.now().getTime()}`;
    if (exerciseType === 'guess_the_word') {
      const ordered = pickPracticeWords(candidates, { packageId, unitId, count: candidates.length, seed: `${packageId}:${direction}:${sessionSalt}`, today: this.clock.now().toISOString().slice(0, 10) });
      if (index >= ordered.length) return null;
      const target = ordered[index];
      if (!target) return null;
      if (direction === 'audio_to_meaning' && target.audio?.status !== 'verified') return null;

      // Ambil distraktor dari seluruh bank kata di paket (boleh meminjam dari unit lain & kata belum dilihat jika kurang)
      const allWords = await this.words(packageId);
      const targetMeaningNorm = target.meaning.toLowerCase().trim();
      const targetLemmaNorm = target.lemma.toLowerCase().trim();
      const poolCandidates = allWords.filter((candidate) => candidate.id !== target.id && candidate.meaning.toLowerCase().trim() !== targetMeaningNorm && candidate.lemma.toLowerCase().trim() !== targetLemmaNorm);
      
      // Prioritaskan kelas kata & tema sama, dan pastikan setiap distraktor memiliki label unik (tidak ambigu)
      const samePosAndTheme = poolCandidates.filter((c) => c.partOfSpeech === target.partOfSpeech && c.theme === target.theme);
      const samePos = poolCandidates.filter((c) => c.partOfSpeech === target.partOfSpeech && c.theme !== target.theme);
      const others = poolCandidates.filter((c) => c.partOfSpeech !== target.partOfSpeech);
      const prioritizedPool = [...samePosAndTheme, ...samePos, ...others];

      const pool: PracticeWordCandidate[] = [];
      const seenLabels = new Set<string>([direction === 'meaning_to_word' ? targetLemmaNorm : targetMeaningNorm]);
      for (const candidate of prioritizedPool) {
        const candidateLabel = (direction === 'meaning_to_word' ? candidate.lemma : candidate.meaning).toLowerCase().trim();
        if (!seenLabels.has(candidateLabel)) {
          seenLabels.add(candidateLabel);
          pool.push(candidate);
          if (pool.length === 3) break;
        }
      }
      if (pool.length < 3) return null;

      const rawOptions = [target, ...pool].map((candidate) => ({
        optionId: candidate.id,
        itemId: candidate.id,
        packageId,
        label: direction === 'meaning_to_word' ? candidate.lemma : candidate.meaning,
      }));

      // Posisi jawaban benar diacak menggunakan shuffle deterministik berbasis seed sesi
      const seedNum = Math.abs(hash(`${sessionSalt}:opt:${target.id}:${index}`));
      const options = shuffle(rawOptions, seedNum);

      const question: GuessTheWordQuestion = {
        type: 'guess_the_word',
        questionId: `guess-${target.id}-${index}`,
        packageId,
        targetItemId: target.id,
        direction,
        prompt: direction === 'word_to_meaning' ? { lemma: target.lemma } : direction === 'meaning_to_word' ? { meaning: target.meaning } : { audio: target.audio ?? undefined },
        options,
        correctOptionId: target.id,
        exampleSentence: await this.exampleSentence(packageId, target.id),
      };
      return validatePracticeQuestion(question).ok ? question : null;
    }

    const rawSentences = await this.database.all<SentenceRow>('SELECT sentences.package_id, sentences.item_id, sentences.unit_id, sentences.item_order, units.unit_order, sentences.payload_json FROM sentences JOIN units ON units.package_id = sentences.package_id AND units.item_id = sentences.unit_id JOIN installed_packages ON installed_packages.package_id = sentences.package_id AND installed_packages.install_state = ? WHERE sentences.package_id = ? AND (? IS NULL OR sentences.unit_id = ?) ORDER BY units.unit_order, sentences.item_order, sentences.item_id', ['active', packageId, unitId ?? null, unitId ?? null]);
    const sentences = shuffle(rawSentences, Math.abs(hash(`${sessionSalt}:sentence_order`)));
    let validIndex = 0;
    const allWords = await this.words(packageId);

    for (const sentence of sentences) {
      try {
        const payload = JSON.parse(sentence.payload_json) as Record<string, unknown>;
        if (payload.status === 'draft' || typeof payload.text !== 'string' || typeof payload.translation !== 'string' || typeof payload.gap !== 'string' || (payload.text.match(/___/g) ?? []).length !== 1) continue;
        const beforeGap = payload.text.split('___')[0] ?? '';
        const afterGap = payload.text.split('___').slice(1).join('___');
        const targetWord = allWords.find((candidate) => candidate.id === String(payload.gap));
        if (!targetWord) continue;

        const compatible = allWords.filter((candidate) => candidate.id !== targetWord.id && candidate.partOfSpeech === targetWord.partOfSpeech && candidate.register === targetWord.register);
        const fallback = allWords.filter((candidate) => candidate.id !== targetWord.id && !compatible.some((item) => item.id === candidate.id));
        const prioritizedCandidates = [...compatible, ...fallback];

        const rawCandidates: PracticeWordCandidate[] = [targetWord];
        const seenCandidateLemmas = new Set<string>([targetWord.lemma.toLowerCase().trim()]);
        for (const candidate of prioritizedCandidates) {
          const lemmaNorm = candidate.lemma.toLowerCase().trim();
          if (!seenCandidateLemmas.has(lemmaNorm)) {
            seenCandidateLemmas.add(lemmaNorm);
            rawCandidates.push(candidate);
            if (rawCandidates.length === 4) break;
          }
        }
        if (rawCandidates.length < 3) continue;

        const seedNum = Math.abs(hash(`${sessionSalt}:opt:${sentence.item_id}:${index}`));
        const shuffledWordCandidates = shuffle(rawCandidates, seedNum);
        const options = shuffledWordCandidates.map((candidate) => ({ optionId: candidate.id, itemId: candidate.id, packageId, label: candidate.lemma }));

        const question: FillTheGapQuestion = {
          type: 'fill_the_gap',
          questionId: `gap-${sentence.item_id}`,
          packageId,
          sentenceId: sentence.item_id,
          missingWordId: String(payload.gap),
          beforeGap,
          afterGap,
          translation: payload.translation,
          gapCount: payload.text.split('___').length - 1,
          options,
          correctOptionId: String(payload.gap),
          audio: audio(payload.audio) ?? undefined,
        };
        if (validatePracticeQuestion(question).ok) {
          if (validIndex === index) return question;
          validIndex += 1;
        }
      } catch { /* malformed sentences are skipped */ }
    }
    return null;
  }

  async getUnits(packageId: string): Promise<RepositoryResult<PracticeUnitInfo[]>> {
    try {
      const rows = await this.database.all<{ item_id: string; title: string; unit_order: number; word_count: number; sentence_count: number; dialogue_count: number }>(
        `SELECT units.item_id, units.title, units.unit_order,
                (SELECT COUNT(*) FROM words WHERE words.package_id = units.package_id AND words.unit_id = units.item_id) AS word_count,
                (SELECT COUNT(*) FROM sentences WHERE sentences.package_id = units.package_id AND sentences.unit_id = units.item_id) AS sentence_count,
                (SELECT COUNT(*) FROM dialogues WHERE dialogues.package_id = units.package_id AND dialogues.unit_id = units.item_id) AS dialogue_count
         FROM units 
         JOIN installed_packages ON installed_packages.package_id = units.package_id AND installed_packages.install_state = ? 
         WHERE units.package_id = ? 
         ORDER BY units.unit_order, units.item_id`,
        ['active', packageId]
      );
      return {
        ok: true,
        data: rows.map((row) => ({
          id: row.item_id,
          title: row.title,
          order: Number(row.unit_order),
          wordCount: Number(row.word_count ?? 0),
          sentenceCount: Number(row.sentence_count ?? 0),
          dialogueCount: Number(row.dialogue_count ?? 0),
        })),
      };
    } catch { return errorResult('Unit latihan belum dapat dibaca.'); }
  }

  async getAvailability(packageId: string, exerciseType: PracticeExerciseType, unitId?: string, direction?: GuessTheWordDirection): Promise<RepositoryResult<{ available: boolean; reason?: string; count: number }>> {
    try {
      if (exerciseType === 'guess_the_word') {
        const candidates = await this.words(packageId, unitId);
        const count = direction === 'audio_to_meaning' ? candidates.filter((word) => word.audio?.status === 'verified').length : candidates.length;
        return { ok: true, data: { available: count >= 1, count, reason: count < 1 ? 'Belum ada cukup materi untuk membuat empat pilihan.' : undefined } };
      }
      if (exerciseType === 'mixed') {
        const words = await this.words(packageId);
        const sentences = await this.database.all<{ item_id: string }>('SELECT item_id FROM sentences WHERE package_id = ?', [packageId]);
        const total = words.length + sentences.length;
        return { ok: true, data: { available: total >= 1, count: total, reason: total < 1 ? 'Belum ada materi untuk ulangan campur.' : undefined } };
      }
      if (exerciseType === 'fill_the_gap') {
        const rawSentences = await this.database.all<{ payload_json: string }>(
          'SELECT sentences.payload_json FROM sentences JOIN installed_packages ON installed_packages.package_id = sentences.package_id AND installed_packages.install_state = ? WHERE sentences.package_id = ? AND (? IS NULL OR sentences.unit_id = ?)',
          ['active', packageId, unitId ?? null, unitId ?? null]
        );
        let validCount = 0;
        for (const s of rawSentences) {
          try {
            const p = JSON.parse(s.payload_json) as Record<string, unknown>;
            if (p.status !== 'draft' && typeof p.gap === 'string' && (String(p.text ?? '').match(/___/g) ?? []).length === 1) {
              validCount += 1;
            }
          } catch { /* skip invalid json */ }
        }
        return {
          ok: true,
          data: {
            available: validCount >= 1,
            count: validCount,
            reason: validCount < 1 ? 'Belum ada kalimat yang cukup untuk latihan ini.' : undefined,
          },
        };
      }
      const question = await this.buildQuestion(packageId, exerciseType, 'word_to_meaning', unitId, 0);
      return { ok: true, data: { available: Boolean(question), count: question ? 1 : 0, reason: question ? undefined : 'Belum ada kalimat yang cukup untuk latihan ini.' } };
    } catch { return errorResult('Ketersediaan latihan belum dapat dibaca.'); }
  }

  async createSession(input: { packageId: string; exerciseType: PracticeExerciseType; unitId?: string; questionCount: number; direction?: GuessTheWordDirection }): Promise<RepositoryResult<PracticeSession>> {
    const count = clampPracticeQuestionCount(input.questionCount);
    const direction = input.direction ?? 'word_to_meaning';
    const sessionSeed = id('seed');
    try {
      const questions: PracticeQuestion[] = [];
      if (input.exerciseType === 'mixed') {
        // Ulangan campur: gabungan tebak kata dan kalimat rumpang lintas unit
        for (let index = 0; index < count; index += 1) {
          const type = index % 2 === 0 ? 'guess_the_word' : 'fill_the_gap';
          let question = await this.buildQuestion(input.packageId, type, direction, undefined, Math.floor(index / 2), sessionSeed);
          if (!question) {
            const fallbackType = type === 'guess_the_word' ? 'fill_the_gap' : 'guess_the_word';
            question = await this.buildQuestion(input.packageId, fallbackType, direction, undefined, Math.floor(index / 2), sessionSeed);
          }
          if (question) questions.push(question);
        }
        // Acak susunan soal dalam sesi ulangan campur
        const shuffledQuestions = shuffle(questions, Math.abs(hash(`${sessionSeed}:session_order`)));
        questions.length = 0;
        questions.push(...shuffledQuestions);
      } else {
        for (let index = 0; index < count; index += 1) {
          const question = await this.buildQuestion(input.packageId, input.exerciseType, direction, input.unitId, index, sessionSeed);
          if (question) questions.push(question);
        }
      }

      if (!questions.length) return errorResult('Belum ada materi yang memenuhi latihan ini.');
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
        const itemId = question.type === 'guess_the_word' ? question.targetItemId : question.missingWordId;
        const itemType = question.type === 'guess_the_word' ? 'word' : 'sentence';
        const event = { eventId: `practice:${input.sessionId}:${input.questionId}`, localSequence: 0, deviceId: this.deviceId, packageId: question.packageId, itemId, eventType: 'practice_answered' as const, source: 'practice' as const, result: correct ? 1 : 0, weight: 1 as const, sessionId: input.sessionId, deviceTime: now.toISOString(), localDate: now.toISOString().slice(0, 10), formulaVersion: 1, payload: { sessionId: input.sessionId, questionId: input.questionId, exerciseType: question.type, targetItemId: itemId, answerId: input.optionId, correct } };
        await this.database.transaction(async (transaction) => {
          const current = await transaction.get<{ answered: number; selected_option_id: string | null; correct: number | null }>('SELECT answered, selected_option_id, correct FROM practice_questions WHERE session_id = ? AND question_id = ?', [input.sessionId, input.questionId]);
          if (current?.answered) { persistedAnswer = { correct: current.correct === 1, selectedOptionId: String(current.selected_option_id) }; return; }
          const eventAlreadyExists = await transaction.get<{ event_id: string }>('SELECT event_id FROM learning_events WHERE event_id = ?', [event.eventId]);
          if (eventAlreadyExists) return;
          const eventResult = await this.progress.appendEventWithin(transaction, event);
          if (!eventResult.ok) throw eventResult.error;
          await transaction.run('UPDATE practice_questions SET answered = 1, selected_option_id = ?, correct = ? WHERE session_id = ? AND question_id = ?', [input.optionId, correct ? 1 : 0, input.sessionId, input.questionId]);
          await transaction.run('UPDATE practice_sessions SET answered_count = answered_count + 1, correct_count = correct_count + ?, current_index = current_index + 1 WHERE session_id = ?', [correct ? 1 : 0, input.sessionId]);
          // Pembaruan langsung item_strength_cache agar realtime
          const typesToUpdate = itemType === 'sentence' ? ['sentence', 'word'] : ['word'];
          for (const type of typesToUpdate) {
            const cacheRow = await transaction.get<{ strength: number }>('SELECT strength FROM item_strength_cache WHERE package_id = ? AND item_id = ? AND item_type = ?', [question.packageId, itemId, type]);
            const oldStr = cacheRow?.strength != null ? Number(cacheRow.strength) : 0.1;
            const newStr = updateStrength(oldStr, correct ? 1.0 : 0.0, 1.0);
            await transaction.run('INSERT OR REPLACE INTO item_strength_cache (package_id, item_id, item_type, strength, last_reviewed_at, last_result, formula_version, calculated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [question.packageId, itemId, type, newStr, now.toISOString(), correct ? 1 : 0, 1, now.toISOString()]);
          }
        });
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
