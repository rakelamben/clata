import { describe, expect, it, beforeEach } from 'vitest';
import type { DatabasePort } from '../../../src/infrastructure/database/DatabasePort';
import { SQLiteChallengeRepository } from '../../../src/features/challenges/data/sqliteChallengeRepository';
import { assertNoLearningEventEmitted } from '../../../src/features/challenges/domain/challengeInvariants';

class InMemoryChallengeDatabase implements DatabasePort {
  private tables: Record<string, any[]> = {
    challenges: [],
    challenge_checks: [],
    learning_events: [],
  };

  async exec(_sql: string): Promise<void> {
    return;
  }

  async run(sql: string, params: readonly unknown[] = []): Promise<{ changes: number; lastInsertRowId?: number }> {
    if (sql.includes('INSERT OR REPLACE INTO challenge_checks') || sql.includes('INSERT INTO challenge_checks')) {
      const packageId = String(params[0]);
      const challengeId = String(params[1]);
      this.tables.challenge_checks = this.tables.challenge_checks.filter(
        (r) => !(r.package_id === packageId && r.challenge_id === challengeId),
      );
      this.tables.challenge_checks.push({
        package_id: packageId,
        challenge_id: challengeId,
        checked_at: String(params[2]),
        variant: String(params[3]),
      });
      return { changes: 1 };
    }

    if (sql.includes('DELETE FROM challenge_checks WHERE package_id = ? AND challenge_id = ?')) {
      const packageId = String(params[0]);
      const challengeId = String(params[1]);
      this.tables.challenge_checks = this.tables.challenge_checks.filter(
        (r) => !(r.package_id === packageId && r.challenge_id === challengeId),
      );
      return { changes: 1 };
    }

    return { changes: 1 };
  }

  async get<T>(sql: string, params: readonly unknown[] = []): Promise<T | null> {
    if (sql.includes('FROM challenge_checks WHERE package_id = ? AND challenge_id = ?')) {
      const match = this.tables.challenge_checks.find(
        (r) => r.package_id === params[0] && r.challenge_id === params[1],
      );
      return (match as T) ?? null;
    }
    return null;
  }

  async all<T>(sql: string, _params: readonly unknown[] = []): Promise<T[]> {
    if (sql.includes('FROM challenges')) {
      return this.tables.challenges.map((c) => {
        const check = this.tables.challenge_checks.find(
          (ck) => ck.package_id === c.package_id && ck.challenge_id === c.item_id,
        );
        return {
          item_id: c.item_id,
          unit_id: c.unit_id,
          payload_json: c.payload_json,
          checked_at: check?.checked_at ?? null,
          variant: check?.variant ?? null,
        } as T;
      });
    }
    return [];
  }

  async transaction<T>(work: (tx: DatabasePort) => Promise<T>): Promise<T> {
    return work(this);
  }

  seedChallenge(packageId: string, challengeId: string, payload: Record<string, unknown>) {
    this.tables.challenges.push({
      package_id: packageId,
      item_id: challengeId,
      unit_id: payload.unit_id ?? 'unit-1',
      item_order: 1,
      payload_json: JSON.stringify(payload),
    });
  }

  getLearningEventCount(): number {
    return this.tables.learning_events.length;
  }
}

describe('SQLiteChallengeRepository integration & invariants', () => {
  let db: InMemoryChallengeDatabase;
  let repo: SQLiteChallengeRepository;
  const mockClock = { now: () => new Date('2026-10-29T20:00:00.000Z') };

  beforeEach(() => {
    db = new InMemoryChallengeDatabase();
    repo = new SQLiteChallengeRepository(db, mockClock);
    db.seedChallenge('jawa-mataraman', 'challenge-sapaan', {
      id: 'challenge-sapaan',
      unit_id: 'unit-1',
      level: 'L1',
      solo: 'Ucapkan sugeng enjing.',
      social: 'Sapa tetangga dengan sugeng enjing.',
    });
  });

  it('toggles check on and off idempotently', async () => {
    const eventsBefore = db.getLearningEventCount();

    // 1. Toggle ON
    const firstToggle = await repo.toggleChallengeCheck({
      packageId: 'jawa-mataraman',
      challengeId: 'challenge-sapaan',
      variant: 'solo',
    });
    expect(firstToggle.ok).toBe(true);
    if (!firstToggle.ok) return;
    expect(firstToggle.data.isChecked).toBe(true);

    // Verify it reflects in getChallenges
    const list1 = await repo.getChallenges('jawa-mataraman');
    expect(list1.ok).toBe(true);
    if (!list1.ok) return;
    expect(list1.data[0].isChecked).toBe(true);
    expect(list1.data[0].checkedVariant).toBe('solo');

    // Invariant: no learning events emitted
    assertNoLearningEventEmitted(eventsBefore, db.getLearningEventCount());

    // 2. Toggle OFF
    const secondToggle = await repo.toggleChallengeCheck({
      packageId: 'jawa-mataraman',
      challengeId: 'challenge-sapaan',
      variant: 'solo',
    });
    expect(secondToggle.ok).toBe(true);
    if (!secondToggle.ok) return;
    expect(secondToggle.data.isChecked).toBe(false);

    // Verify it reflects in getChallenges
    const list2 = await repo.getChallenges('jawa-mataraman');
    expect(list2.ok).toBe(true);
    if (!list2.ok) return;
    expect(list2.data[0].isChecked).toBe(false);

    // Invariant: still zero learning events
    assertNoLearningEventEmitted(eventsBefore, db.getLearningEventCount());
  });
});
