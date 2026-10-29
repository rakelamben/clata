import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DialogueRepository } from '../domain/dialogueRepository';
import type { DialogueGraph, DialogueListItem, DialogueRunState, DialogueChoice } from '../domain/dialogueTypes';
import type { SQLiteProgressRepository } from '../../progress/data/progressRepository';
import type { Clock } from '../../../domain/ports/Clock';
import { createDialogueError } from '../domain/dialogueErrors';

export class SQLiteDialogueRepository implements DialogueRepository {
  constructor(
    private readonly database: DatabasePort,
    private readonly progress: SQLiteProgressRepository,
    private readonly clock: Clock,
    private readonly deviceId: string,
  ) {}

  private nowIso(): string {
    return this.clock.now().toISOString();
  }

  private localDate(): string {
    return this.nowIso().slice(0, 10);
  }

  async listDialogues(packageId: string, unitId?: string): Promise<RepositoryResult<DialogueListItem[]>> {
    try {
      let sql = `
        SELECT d.item_id, d.unit_id, d.payload_json, s.best_score, s.last_completed_at
        FROM dialogues d
        LEFT JOIN dialogue_scores s ON d.package_id = s.package_id AND d.item_id = s.dialogue_id
        WHERE d.package_id = ?
      `;
      const params: unknown[] = [packageId];
      if (unitId) {
        sql += ' AND d.unit_id = ?';
        params.push(unitId);
      }
      sql += ' ORDER BY d.item_order ASC';

      const rows = await this.database.all<{
        item_id: string;
        unit_id: string | null;
        payload_json: string;
        best_score: number | null;
        last_completed_at: string | null;
      }>(sql, params);

      const items: DialogueListItem[] = rows.map((row) => {
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(row.payload_json);
        } catch {
          // fallback
        }
        const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
        return {
          id: String(row.item_id),
          title: String(payload.title ?? row.item_id),
          unitId: String(row.unit_id ?? payload.unit_id ?? ''),
          level: (payload.level as DialogueListItem['level']) ?? 'L1',
          register: (payload.register as DialogueListItem['register']) ?? 'neutral',
          interlocutor: String(payload.interlocutor ?? 'Lawan Bicara'),
          contextDescription: typeof payload.contextDescription === 'string' ? payload.contextDescription : undefined,
          turnCount: nodes.length,
          isCompleted: row.last_completed_at !== null,
          bestScore: row.best_score !== null ? Number(row.best_score) : undefined,
        };
      });

      return { ok: true, data: items };
    } catch (error) {
      return {
        ok: false,
        error: createDialogueError('INVALID_DIALOG_GRAPH', 'Gagal memuat daftar dialog.', { cause: error }),
      };
    }
  }

  async getDialogueGraph(packageId: string, dialogueId: string): Promise<RepositoryResult<DialogueGraph>> {
    try {
      const row = await this.database.get<{
        package_id: string;
        item_id: string;
        graph_fingerprint: string;
        payload_json: string;
      }>(
        'SELECT package_id, item_id, graph_fingerprint, payload_json FROM dialogues WHERE package_id = ? AND item_id = ?',
        [packageId, dialogueId],
      );

      if (!row) {
        return {
          ok: false,
          error: createDialogueError('DIALOGUE_NOT_FOUND', `Dialog '${dialogueId}' tidak ditemukan pada paket '${packageId}'.`),
        };
      }

      const parsed = JSON.parse(row.payload_json) as DialogueGraph;
      const graph: DialogueGraph = {
        ...parsed,
        id: row.item_id,
        packageId: row.package_id,
        graphFingerprint: row.graph_fingerprint,
      };

      return { ok: true, data: graph };
    } catch (error) {
      return {
        ok: false,
        error: createDialogueError('INVALID_DIALOG_GRAPH', `Gagal memuat struktur graf dialog '${dialogueId}'.`, { cause: error }),
      };
    }
  }

  async getActiveRun(packageId: string): Promise<RepositoryResult<DialogueRunState | null>> {
    try {
      const row = await this.database.get<{ run_state_json: string }>(
        'SELECT run_state_json FROM active_dialogue_runs WHERE package_id = ? ORDER BY updated_at DESC LIMIT 1',
        [packageId],
      );

      if (!row) {
        return { ok: true, data: null };
      }

      const runState = JSON.parse(row.run_state_json) as DialogueRunState;
      return { ok: true, data: runState };
    } catch (error) {
      return {
        ok: false,
        error: createDialogueError('INVALID_DIALOG_GRAPH', 'Gagal memuat status dialog aktif.', { cause: error }),
      };
    }
  }

  async saveActiveRun(runState: DialogueRunState): Promise<RepositoryResult<void>> {
    try {
      await this.database.run(
        `INSERT OR REPLACE INTO active_dialogue_runs (
          session_id, run_id, package_id, package_version, graph_fingerprint,
          dialogue_id, current_node_id, sequence, disconnected_attempts,
          run_state_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          runState.sessionId,
          runState.runId,
          runState.packageId,
          runState.packageVersion,
          runState.graphFingerprint,
          runState.dialogueId,
          runState.currentNodeId,
          runState.sequence,
          runState.disconnectedAttempts,
          JSON.stringify(runState),
          this.nowIso(),
        ],
      );
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: createDialogueError('INVALID_DIALOG_GRAPH', 'Gagal menyimpan status percakapan aktif.', { cause: error }),
      };
    }
  }

  async clearActiveRun(sessionId: string): Promise<RepositoryResult<void>> {
    try {
      await this.database.run('DELETE FROM active_dialogue_runs WHERE session_id = ?', [sessionId]);
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: createDialogueError('INVALID_DIALOG_GRAPH', 'Gagal menghapus sesi percakapan.', { cause: error }),
      };
    }
  }

  async recordDialogueChoice(input: {
    runState: DialogueRunState;
    choice: DialogueChoice;
    choiceId: string;
  }): Promise<RepositoryResult<void>> {
    const { runState, choice, choiceId } = input;
    const now = this.nowIso();
    const eventId = `dlg_choice_${runState.runId}_${runState.sequence}`;

    const event = {
      eventId,
      localSequence: 0,
      deviceId: this.deviceId,
      packageId: runState.packageId,
      itemId: runState.dialogueId,
      eventType: 'dialogue_choice' as const,
      source: 'dialogue' as const,
      weight: 1.0,
      sessionId: runState.sessionId,
      deviceTime: now,
      localDate: this.localDate(),
      formulaVersion: 1,
      payload: {
        sessionId: runState.sessionId,
        runId: runState.runId,
        sequence: runState.sequence,
        packageVersion: runState.packageVersion,
        graphFingerprint: runState.graphFingerprint,
        dialogueId: runState.dialogueId,
        nodeId: runState.currentNodeId,
        choiceId,
        choiceType: choice.type,
        quality: choice.quality,
      },
    };

    const appendRes = await this.progress.appendEvent(event);
    if (!appendRes.ok) return appendRes;

    return this.saveActiveRun(runState);
  }

  async completeDialogueRun(input: {
    runState: DialogueRunState;
    dialogue: DialogueGraph;
    score: number;
    endingId: string;
  }): Promise<RepositoryResult<void>> {
    const { runState, dialogue, score, endingId } = input;
    const now = this.nowIso();
    const ending = dialogue.endings.find((e) => e.id === endingId) ?? dialogue.endings[0];
    const endingQuality = ending?.quality ?? 'pas';

    try {
      await this.database.transaction(async (transaction) => {
        // 1. dialogue_completed event
        const completeEvent = {
          eventId: `dlg_done_${runState.runId}`,
          localSequence: 0,
          deviceId: this.deviceId,
          packageId: runState.packageId,
          itemId: runState.dialogueId,
          eventType: 'dialogue_completed' as const,
          source: 'dialogue' as const,
          result: score,
          weight: 1.0,
          sessionId: runState.sessionId,
          deviceTime: now,
          localDate: this.localDate(),
          formulaVersion: 1,
          payload: {
            sessionId: runState.sessionId,
            runId: runState.runId,
            sequence: runState.sequence,
            packageVersion: runState.packageVersion,
            graphFingerprint: runState.graphFingerprint,
            dialogueId: runState.dialogueId,
            endingId,
            endingQuality,
            score,
            completedAt: now,
          },
        };

        const res1 = await this.progress.appendEventWithin(transaction, completeEvent);
        if (!res1.ok) throw res1.error;

        // 2. session_completed event
        const sessionCompletedEvent = {
          eventId: `ses_done_${runState.sessionId}`,
          localSequence: 0,
          deviceId: this.deviceId,
          packageId: runState.packageId,
          eventType: 'session_completed' as const,
          source: 'system' as const,
          weight: 1.0,
          sessionId: runState.sessionId,
          deviceTime: now,
          localDate: this.localDate(),
          formulaVersion: 1,
          payload: {
            sessionId: runState.sessionId,
            exerciseType: 'dialogue',
            completed: true,
            completedAt: now,
          },
        };

        const res2 = await this.progress.appendEventWithin(transaction, sessionCompletedEvent);
        if (!res2.ok) throw res2.error;

        // 3. Update dialogue_scores
        const existing = await transaction.get<{ best_score: number; completed_endings_json: string }>(
          'SELECT best_score, completed_endings_json FROM dialogue_scores WHERE package_id = ? AND dialogue_id = ?',
          [runState.packageId, runState.dialogueId],
        );

        let completedEndings: string[] = [];
        let bestScore = score;

        if (existing) {
          bestScore = Math.max(Number(existing.best_score), score);
          try {
            completedEndings = JSON.parse(existing.completed_endings_json);
          } catch {
            completedEndings = [];
          }
        }
        if (!completedEndings.includes(endingId)) {
          completedEndings.push(endingId);
        }

        await transaction.run(
          `INSERT OR REPLACE INTO dialogue_scores (
            package_id, dialogue_id, best_score, completed_endings_json,
            last_completed_at, formula_version, recalculated_at
          ) VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [
            runState.packageId,
            runState.dialogueId,
            bestScore,
            JSON.stringify(completedEndings),
            now,
            now,
          ],
        );

        // 4. Delete active run
        await transaction.run('DELETE FROM active_dialogue_runs WHERE session_id = ?', [runState.sessionId]);
      });

      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: createDialogueError('RUN_NOT_ACTIVE', 'Gagal menyelesaikan sesi percakapan.', { cause: error }),
      };
    }
  }
}
