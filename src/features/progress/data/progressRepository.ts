import { createAppError } from '../../../domain/errors/AppError';
import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DatabasePort, DatabaseTransaction } from '../../../infrastructure/database/DatabasePort';
import { replayProgress } from '../../../domain/progress/replay';
import type { LearningEvent, ProgressScope, ProgressSnapshot } from '../../../domain/progress/learningEvent';

function resultError(message: string) { return { ok: false as const, error: createAppError('UNKNOWN', message, { recoverable: true }) }; }

function validateEvent(event: LearningEvent): string | null {
  if (!event.eventId || !event.packageId || !event.deviceId || !event.deviceTime || !event.localDate) return 'Event memiliki identitas atau waktu yang tidak lengkap.';
  if (!Number.isInteger(event.formulaVersion) || event.formulaVersion !== 1) return 'Versi formula event tidak didukung.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.localDate) || Number.isNaN(Date.parse(event.deviceTime))) return 'Tanggal event tidak valid.';
  if (!['vocabulary', 'practice', 'dialogue', 'system'].includes(event.source)) return 'Sumber event tidak valid.';
  if (!['word_viewed', 'sentence_viewed', 'practice_answered', 'dialogue_started', 'dialogue_choice', 'dialogue_completed', 'session_started', 'session_completed', 'package_updated'].includes(event.eventType)) return 'Jenis event tidak valid.';
  if (event.weight !== 1) return 'Bobot event P0 tidak valid.';
  if (event.result !== undefined && (!Number.isFinite(event.result) || event.result < 0 || event.result > 1)) return 'Hasil event tidak valid.';
  if (event.eventType === 'word_viewed' && (event.payload.viewedFrom !== 'vocabulary_feed' && event.payload.viewedFrom !== 'curated_dialogue_target')) return 'Sumber tampilan kata tidak valid.';
  if (event.eventType === 'practice_answered' && (typeof event.payload.targetItemId !== 'string' || event.itemId !== event.payload.targetItemId)) return 'Target latihan tidak valid.';
  if (['word_viewed', 'sentence_viewed', 'practice_answered'].includes(event.eventType) && !event.itemId) return 'Item event wajib diisi.';
  if (event.eventType === 'word_viewed' && ((event.source === 'vocabulary' && event.payload.viewedFrom !== 'vocabulary_feed') || (event.source === 'dialogue' && event.payload.viewedFrom !== 'curated_dialogue_target'))) return 'Sumber kata tidak sesuai.';
  if (event.eventType === 'sentence_viewed' && event.source !== 'practice') return 'Sumber kalimat tidak sesuai.';
  if (event.eventType === 'practice_answered' && (event.source !== 'practice' || !['guess_the_word', 'fill_the_gap'].includes(String(event.payload.exerciseType)) || typeof event.payload.correct !== 'boolean')) return 'Payload latihan tidak valid.';
  if (event.eventType.startsWith('dialogue_') && event.source !== 'dialogue') return 'Sumber dialog tidak sesuai.';
  if (event.eventType === 'dialogue_choice' && (typeof event.payload.runId !== 'string' || typeof event.payload.nodeId !== 'string' || typeof event.payload.choiceId !== 'string' || !['register', 'comprehension'].includes(String(event.payload.choiceType)))) return 'Payload pilihan dialog tidak valid.';
  if (event.eventType === 'dialogue_started' && (event.payload.sequence !== 0 || typeof event.payload.runId !== 'string' || typeof event.payload.dialogueId !== 'string')) return 'Payload awal dialog tidak valid.';
  if (event.eventType === 'dialogue_completed' && (typeof event.payload.runId !== 'string' || typeof event.payload.endingId !== 'string' || typeof event.payload.dialogueId !== 'string')) return 'Payload akhir dialog tidak valid.';
  if (event.eventType.startsWith('session_') && event.source !== 'system') return 'Sumber sesi tidak sesuai.';
  if ((event.eventType === 'session_started' || event.eventType === 'session_completed' || event.eventType.startsWith('dialogue_')) && (!event.sessionId || event.payload.sessionId !== event.sessionId)) return 'Session event tidak valid.';
  if (event.eventType === 'session_started' && event.payload.completed !== false) return 'Session start tidak valid.';
  if (event.eventType === 'session_completed' && event.payload.completed !== true) return 'Session completion tidak valid.';
  return null;
}

function fromRow(row: Record<string, unknown>): LearningEvent {
  return {
    eventId: String(row.event_id), localSequence: Number(row.local_sequence), deviceId: String(row.device_id), packageId: String(row.package_id), itemId: row.item_id == null ? undefined : String(row.item_id), eventType: row.event_type as LearningEvent['eventType'], source: row.source as LearningEvent['source'], result: row.result == null ? undefined : Number(row.result), weight: Number(row.weight), sessionId: row.session_id == null ? undefined : String(row.session_id), deviceTime: String(row.device_time), localDate: String(row.local_date), formulaVersion: Number(row.formula_version), payload: JSON.parse(String(row.payload_json)),
  };
}

export interface ProgressRepository {
  appendEvent(event: LearningEvent): Promise<RepositoryResult<void>>;
  appendEventWithin(transaction: DatabaseTransaction, event: LearningEvent): Promise<RepositoryResult<void>>;
  getEvents(scope?: ProgressScope): Promise<RepositoryResult<LearningEvent[]>>;
  rebuild(scope: ProgressScope, today: string, newItemIds?: string[]): Promise<RepositoryResult<ProgressSnapshot>>;
  resetPackage(packageId: string, commandId: string, deviceTime: string): Promise<RepositoryResult<void>>;
  rebuildAll(today: string): Promise<RepositoryResult<void>>;
}

export class SQLiteProgressRepository implements ProgressRepository {
  constructor(private readonly database: DatabasePort, private readonly deviceId: string, private readonly now: () => string = () => new Date().toISOString()) {}

  async appendEvent(event: LearningEvent): Promise<RepositoryResult<void>> {
    const invalid = validateEvent(event);
    if (invalid) return resultError(invalid);
    try {
      await this.database.transaction(async (transaction) => {
        const result = await this.appendEventWithin(transaction, event);
        if (!result.ok) throw result.error;
      });
      return { ok: true, data: undefined };
    } catch (cause) { return { ok: false, error: createAppError('UNKNOWN', 'Learning event gagal disimpan.', { recoverable: true, cause }) }; }
  }

  async appendEventWithin(transaction: DatabaseTransaction, event: LearningEvent): Promise<RepositoryResult<void>> {
    const invalid = validateEvent(event);
    if (invalid) return resultError(invalid);
    const packageRow = await transaction.get('SELECT package_id FROM installed_packages WHERE package_id = ?', [event.packageId]);
    if (!packageRow) return resultError('Paket event belum terpasang.');
    if (event.itemId) {
      const content = await transaction.get('SELECT item_id FROM words WHERE package_id = ? AND item_id = ? UNION ALL SELECT item_id FROM sentences WHERE package_id = ? AND item_id = ? UNION ALL SELECT item_id FROM dialogues WHERE package_id = ? AND item_id = ? UNION ALL SELECT item_id FROM challenges WHERE package_id = ? AND item_id = ?', [event.packageId, event.itemId, event.packageId, event.itemId, event.packageId, event.itemId, event.packageId, event.itemId]);
      if (!content) return resultError('Item event tidak ditemukan di paket.');
    }
    const existing = await transaction.get<{ event_id: string }>('SELECT event_id FROM learning_events WHERE event_id = ?', [event.eventId]);
    if (existing) return { ok: true, data: undefined };
    const sequence = await transaction.get<{ next_sequence: number }>('SELECT next_sequence FROM app_event_sequence WHERE singleton_id = 1');
    const localSequence = Number(sequence?.next_sequence ?? 1);
    await transaction.run('UPDATE app_event_sequence SET next_sequence = ? WHERE singleton_id = 1', [localSequence + 1]);
    await transaction.run('INSERT INTO learning_events (event_id, local_sequence, device_id, package_id, item_id, event_type, source, result, weight, session_id, device_time, received_time, local_date, formula_version, payload_json, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [event.eventId, localSequence, event.deviceId || this.deviceId, event.packageId, event.itemId ?? null, event.eventType, event.source, event.result ?? null, event.weight, event.sessionId ?? null, event.deviceTime, this.now(), event.localDate, event.formulaVersion, JSON.stringify(event.payload), 'local_only']);
    await transaction.run('INSERT OR REPLACE INTO rebuild_markers(scope_type, scope_id, reason, requested_at, formula_version) VALUES (?, ?, ?, ?, ?)', ['package', event.packageId, 'learning_event', this.now(), event.formulaVersion]);
    return { ok: true, data: undefined };
  }

  async getEvents(scope?: ProgressScope): Promise<RepositoryResult<LearningEvent[]>> {
    try {
      const rows = await this.database.all<Record<string, unknown>>('SELECT * FROM learning_events WHERE (? IS NULL OR package_id = ?) ORDER BY local_sequence ASC, event_id ASC', [scope?.packageId ?? null, scope?.packageId ?? null]);
      return { ok: true, data: rows.map(fromRow) };
    } catch (cause) { return { ok: false, error: createAppError('UNKNOWN', 'Learning events gagal dibaca.', { recoverable: true, cause }) }; }
  }

  async rebuild(scope: ProgressScope, today: string, newItemIds: string[] = []): Promise<RepositoryResult<ProgressSnapshot>> {
    const events = await this.getEvents(scope);
    if (!events.ok) return events;
    const database = this.database;
    const boundary = await database.get<{ boundary_local_sequence: number }>('SELECT boundary_local_sequence FROM package_reset_boundaries WHERE package_id = ?', [scope.packageId]);
    const visibleEvents = boundary ? events.data.filter((event) => event.localSequence > Number(boundary.boundary_local_sequence)) : events.data;
    try {
      const snapshot = replayProgress(visibleEvents, scope, today, newItemIds);
      return { ok: true, data: snapshot };
    } catch (cause) {
      return { ok: false, error: createAppError('MIGRATION_FAILED', 'Progress membutuhkan migrasi formula sebelum dapat dibangun ulang.', { recoverable: true, cause }) };
    }
  }

  async resetPackage(packageId: string, commandId: string, deviceTime: string): Promise<RepositoryResult<void>> {
    try {
      await this.database.transaction(async (transaction) => {
        const existing = await transaction.get<{ command_id: string }>('SELECT command_id FROM reset_commands WHERE command_id = ?', [commandId]);
        if (existing) return;
        const sequence = await transaction.get<{ next_sequence: number }>('SELECT next_sequence FROM app_event_sequence WHERE singleton_id = 1');
        const boundary = Number(sequence?.next_sequence ?? 1) - 1;
        await transaction.run('INSERT OR IGNORE INTO reset_commands (command_id, package_id, issued_at, local_applied_at, tombstone_version, boundary_local_sequence, boundary_device_time, boundary_event_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [commandId, packageId, deviceTime, this.now(), 1, boundary, deviceTime, commandId, 'local_pending']);
        await transaction.run('INSERT INTO package_reset_boundaries(package_id, reset_command_id, boundary_local_sequence, boundary_device_time, boundary_event_id, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(package_id) DO UPDATE SET reset_command_id = excluded.reset_command_id, boundary_local_sequence = excluded.boundary_local_sequence, boundary_device_time = excluded.boundary_device_time, boundary_event_id = excluded.boundary_event_id, updated_at = excluded.updated_at WHERE excluded.boundary_local_sequence > package_reset_boundaries.boundary_local_sequence', [packageId, commandId, boundary, deviceTime, commandId, this.now()]);
        await transaction.run('INSERT OR IGNORE INTO sync_outbox(outbox_id, kind, command_id, idempotency_key, account_id, status, attempt_count) VALUES (?, ?, ?, ?, ?, ?, ?)', [commandId, 'reset_command', commandId, `reset:${commandId}`, null, 'pending', 0]);
        await transaction.run('DELETE FROM item_strength_cache WHERE package_id = ?', [packageId]);
        await transaction.run('DELETE FROM dialogue_scores WHERE package_id = ?', [packageId]);
        await transaction.run('DELETE FROM active_dialogue_runs WHERE package_id = ?', [packageId]);
        await transaction.run('DELETE FROM challenge_checks WHERE package_id = ?', [packageId]);
        await transaction.run('DELETE FROM highest_levels WHERE package_id = ?', [packageId]);
        await transaction.run('INSERT OR REPLACE INTO rebuild_markers(scope_type, scope_id, reason, requested_at, formula_version) VALUES (?, ?, ?, ?, ?)', ['package', packageId, 'reset', this.now(), 1]);
        await transaction.run('INSERT OR REPLACE INTO rebuild_markers(scope_type, scope_id, reason, requested_at, formula_version) VALUES (?, ?, ?, ?, ?)', ['global', 'all', 'reset', this.now(), 1]);
      });
      return { ok: true, data: undefined };
    } catch (cause) { return { ok: false, error: createAppError('UNKNOWN', 'Reset progres gagal disimpan.', { recoverable: true, cause }) }; }
  }

  async rebuildAll(today: string): Promise<RepositoryResult<void>> {
    try {
      const packages = await this.database.all<{ package_id: string }>('SELECT package_id FROM installed_packages WHERE install_state = ?', ['active']);
      const snapshots: ProgressSnapshot[] = [];
      for (const installed of packages) {
        const rebuilt = await this.rebuild({ packageId: installed.package_id }, today);
        if (!rebuilt.ok) throw rebuilt.error;
        snapshots.push(rebuilt.data);
      }
      await this.database.transaction(async (transaction) => {
        for (const snapshot of snapshots) {
          await transaction.run('DELETE FROM item_strength_cache WHERE package_id = ?', [snapshot.packageId]);
          for (const item of Object.values(snapshot.wordStrength)) await transaction.run('INSERT INTO item_strength_cache(package_id, item_id, item_type, strength, last_reviewed_at, last_result, formula_version, calculated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [snapshot.packageId, item.itemId, 'word', item.strength, item.lastReviewedAt ?? null, item.lastResult ?? null, 1, this.now()]);
          for (const item of Object.values(snapshot.sentenceStrength)) await transaction.run('INSERT INTO item_strength_cache(package_id, item_id, item_type, strength, last_reviewed_at, last_result, formula_version, calculated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [snapshot.packageId, item.itemId, 'sentence', item.strength, item.lastReviewedAt ?? null, item.lastResult ?? null, 1, this.now()]);
          await transaction.run('INSERT OR REPLACE INTO highest_levels(package_id, highest_level, calculated_at) VALUES (?, ?, ?)', [snapshot.packageId, snapshot.highestLevel, this.now()]);
          await transaction.run('DELETE FROM rebuild_markers WHERE scope_type = ? AND scope_id = ?', ['package', snapshot.packageId]);
        }
        await transaction.run('DELETE FROM rebuild_markers WHERE scope_type = ? AND scope_id = ?', ['global', 'all']);
      });
      return { ok: true, data: undefined };
    } catch (cause) { return { ok: false, error: createAppError('UNKNOWN', 'Derived progress gagal dibangun ulang.', { recoverable: true, cause }) }; }
  }
}
