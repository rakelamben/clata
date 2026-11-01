import { describe, expect, it } from 'vitest';
import { AuditMockDatabase } from './mockDb';
import { SQLitePracticeRepository } from '../src/features/practice/data/sqlitePracticeRepository';
import { SQLiteProgressRepository } from '../src/features/progress/data/progressRepository';
import type { Clock } from '../src/domain/ports/Clock';

function createMockClock(nowDate: Date): Clock {
  return {
    now: () => nowDate,
  };
}

describe('Audit Empiris Tebak Kata (S0, S1, S2, S3)', () => {
  const packageId = 'jawa-mataraman';

  function setupDatabaseWithWords(count: number): AuditMockDatabase {
    const db = new AuditMockDatabase();
    db.units.push({
      package_id: packageId,
      item_id: 'unit-1',
      unit_order: 1,
      title: 'Unggah-Ungguh Dasar',
    });
    for (let i = 1; i <= count; i++) {
      const itemId = `kata-${i}`;
      db.words.push({
        package_id: packageId,
        item_id: itemId,
        unit_id: 'unit-1',
        item_order: i,
        unit_order: 1,
        register: 'ngoko',
        payload_json: JSON.stringify({
          text: `word_${i}`,
          meaning: `arti_${i}`,
          part_of_speech: 'noun',
          theme: 'daily',
          status: 'verified',
        }),
      });
    }
    return db;
  }

  it('S0: Pengguna baru (belum melihat kata apa pun)', async () => {
    let totalUnseenTargets = 0;
    let sessionsCreated = 0;

    for (let s = 0; s < 200; s++) {
      const db = setupDatabaseWithWords(15);
      const progressRepo = new SQLiteProgressRepository(db, `device-${s}`);
      const clock = createMockClock(new Date(2026, 9, 30, 8, s % 60, s));
      const repo = new SQLitePracticeRepository(db, progressRepo, clock, `device-${s}`);

      const sessionResult = await repo.createSession({
        packageId,
        exerciseType: 'guess_the_word',
        questionCount: 10,
        direction: 'word_to_meaning',
      });

      if (sessionResult.ok) {
        sessionsCreated++;
        const questions = db.practiceQuestions.filter((q) => q.session_id === sessionResult.data.sessionId);
        for (const _q of questions) {
          totalUnseenTargets++;
        }
      }
    }

    console.log(`[S0 Result] Sesi berhasil dibuat: ${sessionsCreated}/200`);
    console.log(`[S0 Result] Total target belum dilihat yang muncul: ${totalUnseenTargets} (Harus 0 jika patuh A2)`);
    console.log(`[S0 Result] Persentase target belum dilihat: ${(totalUnseenTargets / (sessionsCreated * 10)) * 100}%`);
  });

  it('S1: Sudah melihat 12 kata, belum menjawab apa pun (200 sesi)', async () => {
    let correctPositionCounts = [0, 0, 0, 0];
    let duplicateTargetsInSessionCount = 0;

    for (let s = 0; s < 200; s++) {
      const db = setupDatabaseWithWords(12);
      const progressRepo = new SQLiteProgressRepository(db, `device-${s}`);
      const clock = createMockClock(new Date(2026, 9, 30, 8, s % 60, s));
      const repo = new SQLitePracticeRepository(db, progressRepo, clock, `device-${s}`);

      const sessionResult = await repo.createSession({
        packageId,
        exerciseType: 'guess_the_word',
        questionCount: 10,
        direction: 'word_to_meaning',
      });

      expect(sessionResult.ok).toBe(true);
      if (sessionResult.ok) {
        const questions = db.practiceQuestions.filter((q) => q.session_id === sessionResult.data.sessionId);
        const targets: string[] = [];
        for (const q of questions) {
          const parsed = JSON.parse(q.question_json);
          targets.push(parsed.targetItemId);
          const correctIdx = parsed.options.findIndex((opt: any) => opt.optionId === parsed.correctOptionId);
          if (correctIdx >= 0 && correctIdx < 4) {
            correctPositionCounts[correctIdx]++;
          }
        }
        const uniqueTargets = new Set(targets);
        if (uniqueTargets.size < targets.length) {
          duplicateTargetsInSessionCount++;
        }
      }
    }

    console.log(`[S1 Result] Distribusi posisi opsi benar: Pos 0: ${correctPositionCounts[0]}, Pos 1: ${correctPositionCounts[1]}, Pos 2: ${correctPositionCounts[2]}, Pos 3: ${correctPositionCounts[3]}`);
    console.log(`[S1 Result] Sesi dengan target kembar (dari 12 kata pool): ${duplicateTargetsInSessionCount}/200`);
  });

  it('S2: 12 kata dilihat; kata-1, kata-2, kata-3 dijawab salah, sisanya benar sekali (200 sesi)', async () => {
    let sessionsWithAllThreeWrong = 0;
    let wrongWordsOccurrenceCount = 0;

    for (let s = 0; s < 200; s++) {
      const db = setupDatabaseWithWords(12);
      for (let i = 1; i <= 12; i++) {
        const isWrong = i === 1 || i === 2 || i === 3;
        db.itemStrengthCache.push({
          package_id: packageId,
          item_type: 'word',
          item_id: `kata-${i}`,
          strength: isWrong ? 0.2 : 0.8,
          last_result: isWrong ? 0 : 1,
        });
      }

      const progressRepo = new SQLiteProgressRepository(db, `device-${s}`);
      const clock = createMockClock(new Date(2026, 9, 30, 8, s % 60, s));
      const repo = new SQLitePracticeRepository(db, progressRepo, clock, `device-${s}`);

      const sessionResult = await repo.createSession({
        packageId,
        exerciseType: 'guess_the_word',
        questionCount: 10,
        direction: 'word_to_meaning',
      });

      expect(sessionResult.ok).toBe(true);
      if (sessionResult.ok) {
        const questions = db.practiceQuestions.filter((q) => q.session_id === sessionResult.data.sessionId);
        const targets = questions.map((q) => JSON.parse(q.question_json).targetItemId);
        const hasAllThree = ['kata-1', 'kata-2', 'kata-3'].every((id) => targets.includes(id));
        if (hasAllThree) {
          sessionsWithAllThreeWrong++;
        }
        for (const id of ['kata-1', 'kata-2', 'kata-3']) {
          if (targets.includes(id)) wrongWordsOccurrenceCount++;
        }
      }
    }

    console.log(`[S2 Result] Kemunculan ketiga kata salah dalam satu sesi: ${sessionsWithAllThreeWrong}/200 (${(sessionsWithAllThreeWrong / 200) * 100}%)`);
    console.log(`[S2 Result] Rata-rata kemunculan kata salah per sesi: ${(wrongWordsOccurrenceCount / (200 * 3)) * 100}%`);
  });

  it('S3: 30 kata dilihat, 20 sesi berturut-turut (10 runs = 200 sesi)', async () => {
    let totalDuplicatesInSession = 0;
    let jaccardSimilarities: number[] = [];
    let uniqueWordsPer20Sessions: number[] = [];
    let seedInvariantSessions = 0;

    function jaccard(a: string[], b: string[]): number {
      const setA = new Set(a);
      const setB = new Set(b);
      const intersection = new Set([...setA].filter((x) => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      return union.size === 0 ? 0 : intersection.size / union.size;
    }

    for (let run = 0; run < 10; run++) {
      const db = setupDatabaseWithWords(30);
      for (let i = 1; i <= 30; i++) {
        db.itemStrengthCache.push({
          package_id: packageId,
          item_type: 'word',
          item_id: `kata-${i}`,
          strength: 0.1,
          last_result: 1,
        });
      }

      const progressRepo = new SQLiteProgressRepository(db, `device-${run}`);
      const wordsInThis20Run = new Set<string>();
      let prevTargets: string[] | null = null;

      for (let s = 0; s < 20; s++) {
        const clock = createMockClock(new Date(2026, 9, 30, 8, s, 0));
        const repo = new SQLitePracticeRepository(db, progressRepo, clock, `device-${run}-${s}`);

        const sessionResult = await repo.createSession({
          packageId,
          exerciseType: 'guess_the_word',
          questionCount: 10,
          direction: 'word_to_meaning',
        });

        expect(sessionResult.ok).toBe(true);
        if (sessionResult.ok) {
          const questions = db.practiceQuestions.filter((q) => q.session_id === sessionResult.data.sessionId);
          const targets = questions.map((q) => JSON.parse(q.question_json).targetItemId);
          targets.forEach((t) => wordsInThis20Run.add(t));

          const unique = new Set(targets);
          if (unique.size < targets.length) {
            totalDuplicatesInSession++;
          }

          if (prevTargets) {
            const jc = jaccard(prevTargets, targets);
            jaccardSimilarities.push(jc);
            if (jc === 1.0) {
              seedInvariantSessions++;
            }
          }
          prevTargets = targets;

          // Simulasikan pembaruan cache jika dihitung
          for (const t of targets) {
            const entry = db.itemStrengthCache.find((c) => c.item_id === t);
            if (entry) {
              entry.strength = Math.min(1.0, entry.strength + 0.3 * 1.0 * (1 - entry.strength));
              entry.last_result = 1;
            }
          }
        }
      }
      uniqueWordsPer20Sessions.push(wordsInThis20Run.size);
    }

    const avgJaccard = jaccardSimilarities.reduce((a, b) => a + b, 0) / jaccardSimilarities.length;
    const avgUniqueWords = uniqueWordsPer20Sessions.reduce((a, b) => a + b, 0) / uniqueWordsPer20Sessions.length;

    console.log(`[S3 Result] Total sesi dengan target kembar: ${totalDuplicatesInSession}/200`);
    console.log(`[S3 Result] Rata-rata kesamaan Jaccard antarsesi: ${avgJaccard.toFixed(4)}`);
    console.log(`[S3 Result] Sesi identik sempurna (Jaccard = 1.0): ${seedInvariantSessions}/${jaccardSimilarities.length}`);
    console.log(`[S3 Result] Rata-rata kata unik per 20 sesi: ${avgUniqueWords.toFixed(1)} dari 30 total kata`);
  });

  it('Verifikasi Kasus Khusus: Pool Kecil (misal 6 kata)', async () => {
    const db = setupDatabaseWithWords(6);
    const progressRepo = new SQLiteProgressRepository(db, 'device-small');
    const clock = createMockClock(new Date(2026, 9, 30, 8, 0, 0));
    const repo = new SQLitePracticeRepository(db, progressRepo, clock, 'device-small');

    const sessionResult = await repo.createSession({
      packageId,
      exerciseType: 'guess_the_word',
      questionCount: 10,
      direction: 'word_to_meaning',
    });

    expect(sessionResult.ok).toBe(true);
    if (sessionResult.ok) {
      const questions = db.practiceQuestions.filter((q) => q.session_id === sessionResult.data.sessionId);
      const targets = questions.map((q) => JSON.parse(q.question_json).targetItemId);
      const uniqueTargets = new Set(targets);
      console.log(`[Pool 6 Result] Jumlah soal: ${targets.length}, Target unik: ${uniqueTargets.size}, Target kembar: ${targets.length - uniqueTargets.size}`);
    }
  });
});
