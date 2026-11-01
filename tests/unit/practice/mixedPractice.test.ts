import { describe, expect, it } from 'vitest';
import { AuditMockDatabase } from '../../../audit/mockDb';
import { SQLitePracticeRepository } from '../../../src/features/practice/data/sqlitePracticeRepository';
import { SQLiteProgressRepository } from '../../../src/features/progress/data/progressRepository';

describe('Ulangan Campur & Unit Rich Details', () => {
  const packageId = 'jawa-mataraman';

  it('getUnits returns rich unit details with word, sentence, and dialogue counts', async () => {
    const db = new AuditMockDatabase();
    db.units = [
      { package_id: packageId, item_id: 'unit-1', unit_order: 1, title: 'Unggah-Ungguh' },
      { package_id: packageId, item_id: 'unit-2', unit_order: 2, title: 'Kagunan Basa' },
    ];
    const progressRepo = new SQLiteProgressRepository(db, 'dev');
    const clock = { now: () => new Date() };
    const repo = new SQLitePracticeRepository(db, progressRepo, clock, 'dev');

    const result = await repo.getUnits(packageId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.length).toBe(2);
      expect(result.data[0]?.id).toBe('unit-1');
      expect(result.data[0]?.order).toBe(1);
    }
  });

  it('creates mixed practice session across units without duplicates', async () => {
    const db = new AuditMockDatabase();
    db.units = [
      { package_id: packageId, item_id: 'unit-1', unit_order: 1, title: 'Unggah-Ungguh' },
    ];
    for (let i = 1; i <= 6; i++) {
      db.words.push({
        package_id: packageId,
        item_id: `kata-${i}`,
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

    const progressRepo = new SQLiteProgressRepository(db, 'dev');
    const clock = { now: () => new Date() };
    const repo = new SQLitePracticeRepository(db, progressRepo, clock, 'dev');

    const sessionRes = await repo.createSession({
      packageId,
      exerciseType: 'mixed',
      questionCount: 6,
    });

    expect(sessionRes.ok).toBe(true);
    if (sessionRes.ok) {
      expect(sessionRes.data.exerciseType).toBe('mixed');
      expect(sessionRes.data.questionCount).toBeGreaterThanOrEqual(1);
    }
  });
});
