import { describe, expect, it, beforeEach } from 'vitest';
import type { DatabasePort } from '../../../src/infrastructure/database/DatabasePort';
import { SQLiteDialogueRepository } from '../../../src/features/dialogues/data/sqliteDialogueRepository';
import type { SQLiteProgressRepository } from '../../../src/features/progress/data/progressRepository';
import type { DialogueGraph, DialogueRunState } from '../../../src/features/dialogues/domain/dialogueTypes';

class InMemoryDatabase implements DatabasePort {
  private tables: Record<string, any[]> = {
    dialogues: [],
    dialogue_scores: [],
    active_dialogue_runs: [],
    learning_events: [],
  };

  async exec(_sql: string): Promise<void> {
    return;
  }

  async run(sql: string, params: readonly unknown[] = []): Promise<{ changes: number; lastInsertRowId?: number }> {
    if (sql.includes('INSERT OR REPLACE INTO active_dialogue_runs') || sql.includes('INSERT INTO active_dialogue_runs')) {
      const sessionId = String(params[0]);
      this.tables.active_dialogue_runs = this.tables.active_dialogue_runs.filter((r) => r.session_id !== sessionId);
      this.tables.active_dialogue_runs.push({
        session_id: sessionId,
        run_id: String(params[1]),
        package_id: String(params[2]),
        package_version: String(params[3]),
        graph_fingerprint: String(params[4]),
        dialogue_id: String(params[5]),
        current_node_id: String(params[6]),
        sequence: Number(params[7]),
        disconnected_attempts: Number(params[8]),
        run_state_json: String(params[9]),
        updated_at: String(params[10]),
      });
      return { changes: 1 };
    }

    if (sql.includes('DELETE FROM active_dialogue_runs WHERE session_id = ?')) {
      const sessionId = String(params[0]);
      this.tables.active_dialogue_runs = this.tables.active_dialogue_runs.filter((r) => r.session_id !== sessionId);
      return { changes: 1 };
    }

    if (sql.includes('INSERT OR REPLACE INTO dialogue_scores')) {
      const packageId = String(params[0]);
      const dialogueId = String(params[1]);
      this.tables.dialogue_scores = this.tables.dialogue_scores.filter(
        (r) => !(r.package_id === packageId && r.dialogue_id === dialogueId),
      );
      this.tables.dialogue_scores.push({
        package_id: packageId,
        dialogue_id: dialogueId,
        best_score: Number(params[2]),
        completed_endings_json: String(params[3]),
        last_completed_at: String(params[4]),
      });
      return { changes: 1 };
    }

    return { changes: 1 };
  }

  async get<T>(sql: string, params: readonly unknown[] = []): Promise<T | null> {
    if (sql.includes('FROM dialogues WHERE package_id = ? AND item_id = ?')) {
      const match = this.tables.dialogues.find(
        (r) => r.package_id === params[0] && r.item_id === params[1],
      );
      return (match as T) ?? null;
    }
    if (sql.includes('FROM active_dialogue_runs WHERE package_id = ?')) {
      const match = this.tables.active_dialogue_runs.find((r) => r.package_id === params[0]);
      return (match as T) ?? null;
    }
    if (sql.includes('FROM dialogue_scores WHERE package_id = ? AND dialogue_id = ?')) {
      const match = this.tables.dialogue_scores.find(
        (r) => r.package_id === params[0] && r.dialogue_id === params[1],
      );
      return (match as T) ?? null;
    }
    return null;
  }

  async all<T>(sql: string, _params: readonly unknown[] = []): Promise<T[]> {
    if (sql.includes('FROM dialogues')) {
      return this.tables.dialogues as T[];
    }
    return [];
  }

  async transaction<T>(work: (tx: DatabasePort) => Promise<T>): Promise<T> {
    return work(this);
  }

  seedDialogue(packageId: string, dialogue: DialogueGraph) {
    this.tables.dialogues.push({
      package_id: packageId,
      item_id: dialogue.id,
      unit_id: dialogue.unit_id ?? 'unit-1',
      graph_fingerprint: 'fp-1',
      payload_json: JSON.stringify(dialogue),
    });
  }
}

describe('SQLiteDialogueRepository integration', () => {
  let db: InMemoryDatabase;
  let repo: SQLiteDialogueRepository;
  const mockClock = { now: () => new Date('2026-10-29T20:00:00.000Z') };
  const mockProgress = {
    appendEvent: async () => ({ ok: true, data: undefined }),
    appendEventWithin: async () => ({ ok: true, data: undefined }),
  } as unknown as SQLiteProgressRepository;

  beforeEach(() => {
    db = new InMemoryDatabase();
    repo = new SQLiteDialogueRepository(db, mockProgress, mockClock, 'dev-1');
  });

  it('saves and resumes active dialogue run', async () => {
    const runState: DialogueRunState = {
      sessionId: 'ses-100',
      runId: 'run-100',
      packageId: 'jawa-mataraman',
      packageVersion: '1.0.0',
      graphFingerprint: 'fp-100',
      dialogueId: 'dlg-sapaan',
      currentNodeId: 'n2',
      sequence: 2,
      status: 'in_progress',
      history: [],
      selectedChoices: [],
      disconnectedAttempts: 0,
      startedAt: '2026-10-29T20:00:00.000Z',
    };

    const saveRes = await repo.saveActiveRun(runState);
    expect(saveRes.ok).toBe(true);

    const activeRes = await repo.getActiveRun('jawa-mataraman');
    expect(activeRes.ok).toBe(true);
    if (!activeRes.ok) return;
    expect(activeRes.data?.sessionId).toBe('ses-100');
    expect(activeRes.data?.currentNodeId).toBe('n2');
  });

  it('clears active run and records completion', async () => {
    const runState: DialogueRunState = {
      sessionId: 'ses-200',
      runId: 'run-200',
      packageId: 'jawa-mataraman',
      packageVersion: '1.0.0',
      graphFingerprint: 'fp-200',
      dialogueId: 'dlg-sapaan',
      currentNodeId: 'end',
      sequence: 5,
      status: 'completed',
      history: [],
      selectedChoices: [],
      disconnectedAttempts: 0,
      startedAt: '2026-10-29T20:00:00.000Z',
    };

    await repo.saveActiveRun(runState);

    const completeRes = await repo.completeDialogueRun({
      runState,
      dialogue: {
        id: 'dlg-sapaan',
        title: 'Sapaan',
        level: 'L1',
        register: 'neutral',
        interlocutor: 'neighbor',
        nodes: [],
        endings: [{ id: 'end', quality: 'pas', feedback: 'Bagus!' }],
      },
      score: 1.0,
      endingId: 'end',
    });

    expect(completeRes.ok).toBe(true);

    const activeRes = await repo.getActiveRun('jawa-mataraman');
    expect(activeRes.ok).toBe(true);
    if (!activeRes.ok) return;
    expect(activeRes.data).toBeNull();
  });
});
