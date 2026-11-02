import { describe, expect, it, beforeEach } from 'vitest';

import { InMemoryDatabaseAdapter } from '../../../src/infrastructure/database/appDatabase';
import { UnitProgressRepository } from '../../../src/infrastructure/database/unitProgressRepository';

describe('UnitProgressRepository', () => {
  let db: InMemoryDatabaseAdapter;
  let repo: UnitProgressRepository;

  beforeEach(() => {
    db = new InMemoryDatabaseAdapter();
    repo = new UnitProgressRepository(db);
  });

  it('returns null when session has not been completed', async () => {
    const progress = await repo.getUnitSessionProgress('jawa-mataraman', 'unit-1', 'unit-1-w1');
    expect(progress).toBeNull();
  });

  it('records session completion and retrieves it', async () => {
    const saved = await repo.recordSessionCompletion('jawa-mataraman', 'unit-1', 'unit-1-w1', 95);
    expect(saved.package_id).toBe('jawa-mataraman');
    expect(saved.unit_id).toBe('unit-1');
    expect(saved.session_id).toBe('unit-1-w1');
    expect(saved.is_completed).toBe(1);
    expect(saved.score_percentage).toBe(95);
    expect(saved.completed_at).toBeTruthy();

    const fetched = await repo.getUnitSessionProgress('jawa-mataraman', 'unit-1', 'unit-1-w1');
    expect(fetched).not.toBeNull();
    expect(fetched?.is_completed).toBe(1);
    expect(fetched?.score_percentage).toBe(95);
  });

  it('calculates unit summary and percentage correctly', async () => {
    // 0 sessions completed out of 11
    let summary = await repo.getUnitSummary('jawa-mataraman', 'unit-1', 11);
    expect(summary.completedCount).toBe(0);
    expect(summary.percentage).toBe(0);

    // Complete 1 session
    await repo.recordSessionCompletion('jawa-mataraman', 'unit-1', 'unit-1-w1', 100);
    summary = await repo.getUnitSummary('jawa-mataraman', 'unit-1', 11);
    expect(summary.completedCount).toBe(1);
    expect(summary.percentage).toBe(9); // round(1/11 * 100) = 9%

    // Complete another session
    await repo.recordSessionCompletion('jawa-mataraman', 'unit-1', 'unit-1-s1', 100);
    summary = await repo.getUnitSummary('jawa-mataraman', 'unit-1', 11);
    expect(summary.completedCount).toBe(2);
    expect(summary.percentage).toBe(18); // round(2/11 * 100) = 18%

    // Check isolation per unit
    const unit2Summary = await repo.getUnitSummary('jawa-mataraman', 'unit-2', 10);
    expect(unit2Summary.completedCount).toBe(0);
    expect(unit2Summary.percentage).toBe(0);
  });

  it('retrieves completed sessions grouped by unit for a package', async () => {
    await repo.recordSessionCompletion('pkg-1', 'unit-1', 's1', 100);
    await repo.recordSessionCompletion('pkg-1', 'unit-1', 's2', 100);
    await repo.recordSessionCompletion('pkg-1', 'unit-2', 's3', 100);
    await repo.recordSessionCompletion('pkg-2', 'unit-1', 's99', 100);

    const map = await repo.getCompletedSessionsByPackage('pkg-1');
    expect(map['unit-1']).toBeDefined();
    expect(map['unit-1'].has('s1')).toBe(true);
    expect(map['unit-1'].has('s2')).toBe(true);
    expect(map['unit-1'].has('s3')).toBe(false);

    expect(map['unit-2']).toBeDefined();
    expect(map['unit-2'].has('s3')).toBe(true);

    expect(map['pkg-2']).toBeUndefined();
  });

  it('retrieves all unit progress records mapped by unitId:sessionId', async () => {
    await repo.recordSessionCompletion('pkg-1', 'unit-1', 'unit-1-w1', 90);
    await repo.recordSessionCompletion('pkg-1', 'unit-1', 'unit-1-s1', 100);
    await repo.recordSessionCompletion('pkg-1', 'unit-2', 'unit-2-w1', 80);

    const allProgress = await repo.getAllUnitProgress('pkg-1');
    expect(allProgress['unit-1:unit-1-w1']).toBeDefined();
    expect(allProgress['unit-1:unit-1-w1']?.score_percentage).toBe(90);
    expect(allProgress['unit-1:unit-1-s1']?.is_completed).toBe(1);
    expect(allProgress['unit-2:unit-2-w1']?.score_percentage).toBe(80);
    expect(allProgress['unit-1:unit-1-d1']).toBeUndefined();
  });
});
