import { describe, expect, it, beforeEach } from 'vitest';
import type { DatabasePort, DatabaseTransaction } from '../../../src/infrastructure/database/DatabasePort';
import { SQLiteProgressRepository } from '../../../src/features/progress/data/progressRepository';

class MockResetDatabase implements DatabasePort {
  public resetCommands: any[] = [];
  public boundaries: any[] = [];
  public syncOutbox: any[] = [];
  public strengthCache: any[] = [];
  public dialogueScores: any[] = [];
  public activeRuns: any[] = [];
  public challengeChecks: any[] = [];
  public highestLevels: any[] = [];
  public rebuildMarkers: any[] = [];
  public learningEvents: any[] = [];
  public eventSequence = 10;

  async exec(_sql: string): Promise<void> {}

  async run(sql: string, params: readonly unknown[] = []): Promise<{ changes: number }> {
    return this.handleRun(sql, params);
  }

  async get<T>(sql: string, params: readonly unknown[] = []): Promise<T | null> {
    if (sql.includes('SELECT command_id FROM reset_commands')) {
      const match = this.resetCommands.find((r) => r.command_id === params[0]);
      return (match ? { command_id: match.command_id } : null) as T;
    }
    if (sql.includes('SELECT next_sequence FROM app_event_sequence')) {
      return { next_sequence: this.eventSequence } as T;
    }
    if (sql.includes('SELECT boundary_local_sequence FROM package_reset_boundaries')) {
      const match = this.boundaries.find((b) => b.package_id === params[0]);
      return (match ? { boundary_local_sequence: match.boundary_local_sequence } : null) as T;
    }
    return null;
  }

  async all<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    if (sql.includes('SELECT * FROM learning_events')) {
      const pkg = params[0];
      const filtered = pkg
        ? this.learningEvents.filter((e) => e.package_id === pkg)
        : this.learningEvents;
      return filtered as T[];
    }
    if (sql.includes('SELECT package_id FROM installed_packages')) {
      return [{ package_id: 'jawa-mataraman' }] as T[];
    }
    return [];
  }

  async transaction<T>(work: (trx: DatabaseTransaction) => Promise<T>): Promise<T> {
    return work(this);
  }

  private handleRun(sql: string, params: readonly unknown[] = []): { changes: number } {
    if (sql.includes('INSERT OR IGNORE INTO reset_commands')) {
      this.resetCommands.push({
        command_id: params[0],
        package_id: params[1],
        issued_at: params[2],
        boundary_local_sequence: params[5],
      });
      return { changes: 1 };
    }
    if (sql.includes('INSERT INTO package_reset_boundaries')) {
      this.boundaries = this.boundaries.filter((b) => b.package_id !== params[0]);
      this.boundaries.push({
        package_id: params[0],
        reset_command_id: params[1],
        boundary_local_sequence: params[2],
      });
      return { changes: 1 };
    }
    if (sql.includes('INSERT OR IGNORE INTO sync_outbox')) {
      this.syncOutbox.push({
        outbox_id: params[0],
        kind: params[1],
        command_id: params[2],
      });
      return { changes: 1 };
    }
    if (sql.includes('DELETE FROM item_strength_cache WHERE package_id = ?')) {
      const before = this.strengthCache.length;
      this.strengthCache = this.strengthCache.filter((r) => r.package_id !== params[0]);
      return { changes: before - this.strengthCache.length };
    }
    if (sql.includes('DELETE FROM dialogue_scores WHERE package_id = ?')) {
      const before = this.dialogueScores.length;
      this.dialogueScores = this.dialogueScores.filter((r) => r.package_id !== params[0]);
      return { changes: before - this.dialogueScores.length };
    }
    if (sql.includes('DELETE FROM active_dialogue_runs WHERE package_id = ?')) {
      const before = this.activeRuns.length;
      this.activeRuns = this.activeRuns.filter((r) => r.package_id !== params[0]);
      return { changes: before - this.activeRuns.length };
    }
    if (sql.includes('DELETE FROM challenge_checks WHERE package_id = ?')) {
      const before = this.challengeChecks.length;
      this.challengeChecks = this.challengeChecks.filter((r) => r.package_id !== params[0]);
      return { changes: before - this.challengeChecks.length };
    }
    if (sql.includes('DELETE FROM highest_levels WHERE package_id = ?')) {
      this.highestLevels = this.highestLevels.filter((r) => r.package_id !== params[0]);
      return { changes: 1 };
    }
    if (sql.includes('INSERT OR REPLACE INTO rebuild_markers')) {
      this.rebuildMarkers.push({ scope_type: params[0], scope_id: params[1] });
      return { changes: 1 };
    }
    return { changes: 1 };
  }
}

describe('sqliteResetTransaction', () => {
  let db: MockResetDatabase;
  let repo: SQLiteProgressRepository;

  beforeEach(() => {
    db = new MockResetDatabase();
    repo = new SQLiteProgressRepository(db, 'dev-device');

    // Populate initial state with 2 packages
    db.strengthCache = [
      { package_id: 'jawa-mataraman', item_id: 'word-1', strength: 0.8 },
      { package_id: 'sunda-priangan', item_id: 'word-10', strength: 0.9 },
    ];
    db.dialogueScores = [
      { package_id: 'jawa-mataraman', dialogue_id: 'dlg-1', score: 1.0 },
      { package_id: 'sunda-priangan', dialogue_id: 'dlg-2', score: 0.9 },
    ];
    db.activeRuns = [
      { package_id: 'jawa-mataraman', session_id: 'ses-1' },
    ];
    db.challengeChecks = [
      { package_id: 'jawa-mataraman', challenge_id: 'ch-1' },
      { package_id: 'sunda-priangan', challenge_id: 'ch-2' },
    ];
    db.learningEvents = [
      {
        event_id: 'evt-1',
        local_sequence: 1,
        package_id: 'jawa-mataraman',
        item_id: 'word-1',
        event_type: 'word_viewed',
        source: 'vocabulary',
        result: null,
        weight: 1,
        device_time: '2026-10-29T08:00:00Z',
        local_date: '2026-10-29',
        formula_version: 1,
        payload_json: JSON.stringify({ viewedFrom: 'vocabulary_feed' }),
      },
      {
        event_id: 'evt-2',
        local_sequence: 2,
        package_id: 'sunda-priangan',
        item_id: 'word-10',
        event_type: 'word_viewed',
        source: 'vocabulary',
        result: null,
        weight: 1,
        device_time: '2026-10-29T08:00:00Z',
        local_date: '2026-10-29',
        formula_version: 1,
        payload_json: JSON.stringify({ viewedFrom: 'vocabulary_feed' }),
      },
    ];
  });

  it('resets target package atomically without touching other packages', async () => {
    const result = await repo.resetPackage('jawa-mataraman', 'cmd-1', '2026-10-29T10:00:00Z');
    expect(result.ok).toBe(true);

    // Verify boundary was set at sequence 9 (10 - 1)
    expect(db.boundaries).toHaveLength(1);
    expect(db.boundaries[0].package_id).toBe('jawa-mataraman');
    expect(db.boundaries[0].boundary_local_sequence).toBe(9);

    // Verify sync outbox row created
    expect(db.syncOutbox).toHaveLength(1);
    expect(db.syncOutbox[0].command_id).toBe('cmd-1');

    // Verify target package caches deleted
    expect(db.strengthCache.filter((r) => r.package_id === 'jawa-mataraman')).toHaveLength(0);
    expect(db.dialogueScores.filter((r) => r.package_id === 'jawa-mataraman')).toHaveLength(0);
    expect(db.activeRuns.filter((r) => r.package_id === 'jawa-mataraman')).toHaveLength(0);
    expect(db.challengeChecks.filter((r) => r.package_id === 'jawa-mataraman')).toHaveLength(0);

    // Verify other package caches remain intact!
    expect(db.strengthCache.filter((r) => r.package_id === 'sunda-priangan')).toHaveLength(1);
    expect(db.dialogueScores.filter((r) => r.package_id === 'sunda-priangan')).toHaveLength(1);
    expect(db.challengeChecks.filter((r) => r.package_id === 'sunda-priangan')).toHaveLength(1);
  });

  it('ignores events at or before the boundary sequence during progress rebuild', async () => {
    await repo.resetPackage('jawa-mataraman', 'cmd-1', '2026-10-29T10:00:00Z');

    // Rebuild progress for jawa-mataraman
    const rebuildResult = await repo.rebuild({ packageId: 'jawa-mataraman' }, '2026-10-29');
    expect(rebuildResult.ok).toBe(true);
    if (!rebuildResult.ok) return;

    // Mastery must be 0 and no words in active strength cache because evt-1 has sequence 1 <= 9
    expect(rebuildResult.data.mastery).toBe(0);
    expect(Object.keys(rebuildResult.data.wordStrength)).toHaveLength(0);
  });
});
