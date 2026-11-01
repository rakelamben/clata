import { describe, expect, it } from 'vitest';
import { AuditMockDatabase } from './mockDb';
import { SQLitePracticeRepository } from '../src/features/practice/data/sqlitePracticeRepository';
import { SQLiteProgressRepository } from '../src/features/progress/data/progressRepository';

describe('Audit Sintetis Unit (B1 - B7)', () => {
  const packageId = 'jawa-mataraman';

  it('B1: Urutan unit dari database berdasarkan unit_order, bukan alfabet item_id', async () => {
    const db = new AuditMockDatabase();
    // Urutan acak: unit-b (order 1), unit-c (order 2), unit-a (order 3)
    db.units = [
      { package_id: packageId, item_id: 'unit-c', unit_order: 2, title: 'Unit C (Tengah)' },
      { package_id: packageId, item_id: 'unit-a', unit_order: 3, title: 'Unit A (Terakhir)' },
      { package_id: packageId, item_id: 'unit-b', unit_order: 1, title: 'Unit B (Pertama)' },
    ];
    // Urutkan db.units berdasarkan order agar mensimulasikan query SQLite ORDER BY units.unit_order
    db.units.sort((a, b) => a.unit_order - b.unit_order);

    const progressRepo = new SQLiteProgressRepository(db, 'dev');
    const clock = { now: () => new Date() };
    const repo = new SQLitePracticeRepository(db, progressRepo, clock, 'device-test');

    const result = await repo.getUnits(packageId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.map((u) => u.id)).toEqual(['unit-b', 'unit-c', 'unit-a']);
      expect(result.data.map((u) => u.order)).toEqual([1, 2, 3]);
    }
  });

  it('B3 & B4: Unit tanpa kalimat / kata yang cukup mengembalikan ketersediaan yang tepat atau kegagalan', async () => {
    const db = new AuditMockDatabase();
    db.units = [
      { package_id: packageId, item_id: 'unit-empty', unit_order: 1, title: 'Unit Kosong' },
    ];
    // Tidak ada kata dan tidak ada kalimat untuk unit-empty
    const progressRepo = new SQLiteProgressRepository(db, 'dev');
    const clock = { now: () => new Date() };
    const repo = new SQLitePracticeRepository(db, progressRepo, clock, 'device-test');

    // Cek availability guess_the_word
    const availGuess = await repo.getAvailability(packageId, 'guess_the_word', 'unit-empty');
    expect(availGuess.ok).toBe(true);
    if (availGuess.ok) {
      expect(availGuess.data.available).toBe(false);
      expect(availGuess.data.count).toBe(0);
      expect(availGuess.data.reason).toBe('Belum ada cukup materi untuk membuat empat pilihan.');
    }

    // Coba buat sesi langsung pada unit kosong
    const sessionRes = await repo.createSession({
      packageId,
      exerciseType: 'guess_the_word',
      unitId: 'unit-empty',
      questionCount: 10,
    });
    expect(sessionRes.ok).toBe(false);
    if (!sessionRes.ok) {
      expect(sessionRes.error.message).toBe('Belum ada materi yang memenuhi latihan ini.');
    }
  });

  it('B3: Distraktor dapat meminjam kata lintas unit saat materi unit berjalan sedikit', async () => {
    const db = new AuditMockDatabase();
    db.units = [
      { package_id: packageId, item_id: 'unit-1', unit_order: 1, title: 'Unit 1' },
      { package_id: packageId, item_id: 'unit-2', unit_order: 2, title: 'Unit 2' },
    ];
    // Tambahkan hanya 2 kata di unit-1 (tidak cukup 4 opsi)
    for (let i = 1; i <= 2; i++) {
      db.words.push({
        package_id: packageId,
        item_id: `u1-kata-${i}`,
        unit_id: 'unit-1',
        item_order: i,
        unit_order: 1,
        register: 'ngoko',
        payload_json: JSON.stringify({ text: `u1_w${i}`, meaning: `u1_m${i}`, status: 'verified' }),
      });
    }
    // Tambahkan 20 kata di unit-2
    for (let i = 1; i <= 20; i++) {
      db.words.push({
        package_id: packageId,
        item_id: `u2-kata-${i}`,
        unit_id: 'unit-2',
        item_order: i,
        unit_order: 2,
        register: 'ngoko',
        payload_json: JSON.stringify({ text: `u2_w${i}`, meaning: `u2_m${i}`, status: 'verified' }),
      });
    }

    const progressRepo = new SQLiteProgressRepository(db, 'dev');
    const clock = { now: () => new Date() };
    const repo = new SQLitePracticeRepository(db, progressRepo, clock, 'device-test');

    // Sesi untuk unit-1
    const sessionRes = await repo.createSession({
      packageId,
      exerciseType: 'guess_the_word',
      unitId: 'unit-1',
      questionCount: 2,
    });

    expect(sessionRes.ok).toBe(true);
    if (sessionRes.ok) {
      const questions = db.practiceQuestions.filter((q) => q.session_id === sessionRes.data.sessionId);
      for (const q of questions) {
        const parsed = JSON.parse(q.question_json);
        // Distraktor opsi: periksa apakah ada opsi dari unit-2 (meminjam lintas unit)
        const optionItemIds = parsed.options.map((opt: any) => opt.itemId);
        const hasUnit2Distractor = optionItemIds.some((id: string) => id.startsWith('u2-'));
        expect(hasUnit2Distractor).toBe(true);
      }
    }
  });
});
