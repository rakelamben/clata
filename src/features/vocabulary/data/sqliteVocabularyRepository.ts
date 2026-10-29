import { createAppError } from '../../../domain/errors/AppError';
import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import { matchesVocabularySearch } from '../domain/searchNormalization';
import type { AudioReference, VocabularyFilters, VocabularyPage, VocabularyPageRequest, VocabularyRepository, VocabularyWord } from '../domain/vocabularyTypes';

type WordRow = { package_id: string; package_version: string; item_id: string; unit_id: string; item_order: number; unit_order: number; payload_json: string };

function errorResult<T>(message: string): RepositoryResult<T> {
  return { ok: false, error: createAppError('UNKNOWN', message, { recoverable: true }) };
}

function mapWord(row: WordRow, registerMapping: Record<string, string>): VocabularyWord {
  const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
  if (typeof payload.id !== 'string' || typeof payload.text !== 'string' || typeof payload.meaning !== 'string') throw new Error('Payload kata tidak lengkap.');
  const audioPayload = typeof payload.audio === 'object' && payload.audio !== null ? payload.audio as Record<string, unknown> : null;
  const audioStatus = audioPayload?.status === 'verified' || audioPayload?.status === 'poc' || audioPayload?.status === 'unavailable' ? audioPayload.status : 'unavailable';
  const audio: AudioReference | null = audioPayload && typeof audioPayload.path === 'string' && (audioPayload.format === 'opus' || audioPayload.format === 'm4a' || audioPayload.format === 'aac') && Number.isFinite(audioPayload.durationMs) && Number(audioPayload.durationMs) > 0 && Number.isInteger(audioPayload.channels) && Number(audioPayload.channels) > 0 && Number.isInteger(audioPayload.sampleRateHz) && Number(audioPayload.sampleRateHz) > 0
    ? { path: audioPayload.path, format: audioPayload.format, durationMs: Number(audioPayload.durationMs), channels: Number(audioPayload.channels), sampleRateHz: Number(audioPayload.sampleRateHz), status: audioStatus }
    : null;
  return {
    packageId: row.package_id,
    packageVersion: row.package_version,
    id: row.item_id,
    unitId: row.unit_id,
    curriculumOrder: row.unit_order * 100000 + row.item_order,
    lemma: payload.text,
    meaning: payload.meaning,
    partOfSpeech: typeof payload.part_of_speech === 'string' ? payload.part_of_speech : undefined,
    register: typeof payload.register === 'string' ? payload.register : 'unknown',
    registerLabel: typeof payload.register === 'string' ? registerMapping[payload.register] ?? payload.register : undefined,
    theme: typeof payload.theme === 'string' ? payload.theme : undefined,
    // Current POC content only declares a string path, so it remains unavailable.
    // Only signed metadata-bearing audio objects become playable.
    audio,
    status: payload.status === 'verified' || payload.status === 'draft' ? payload.status : 'poc',
  };
}

export class SQLiteVocabularyRepository implements VocabularyRepository {
  constructor(private readonly database: DatabasePort) {}

  private async all(packageId: string): Promise<VocabularyWord[]> {
    const packageRow = await this.database.get<{ package_version: string }>('SELECT package_version FROM installed_packages WHERE package_id = ? AND install_state = ?', [packageId, 'active']);
    if (!packageRow) return [];
    const manifestRow = await this.database.get<{ data: Uint8Array }>('SELECT data FROM package_archive_entries WHERE package_id = ? AND package_version = ? AND path = ?', [packageId, packageRow.package_version, 'manifest.json']);
    let registerMapping: Record<string, string> = {};
    if (manifestRow?.data) {
      try { registerMapping = JSON.parse(new TextDecoder().decode(manifestRow.data)).registerMapping ?? {}; } catch { registerMapping = {}; }
    }
    const rows = await this.database.all<WordRow>('SELECT words.package_id, installed_packages.package_version, words.item_id, words.unit_id, words.item_order, units.unit_order, words.payload_json FROM words JOIN units ON units.package_id = words.package_id AND units.item_id = words.unit_id JOIN installed_packages ON installed_packages.package_id = words.package_id AND installed_packages.install_state = ? WHERE words.package_id = ? ORDER BY units.unit_order ASC, words.item_order ASC, words.item_id ASC', ['active', packageId]);
    return rows.flatMap((row) => { try { return [mapWord(row, registerMapping)]; } catch { return []; } });
  }

  async getFeedPage(request: VocabularyPageRequest): Promise<RepositoryResult<VocabularyPage>> {
    try {
      const all = await this.all(request.packageId);
      const limit = Math.min(Math.max(Math.floor(request.limit) || 20, 1), 50);
      const cursorIndex = request.cursor ? all.findIndex((word) => `${word.curriculumOrder}:${word.id}` === request.cursor) : -1;
      if (request.cursor && cursorIndex < 0) return errorResult('Cursor kosakata sudah tidak berlaku.');
      const start = request.cursor ? cursorIndex + 1 : 0;
      const items = all.slice(Math.max(start, 0), Math.max(start, 0) + limit);
      return { ok: true, data: { items, nextCursor: items.length === limit ? `${items[items.length - 1].curriculumOrder}:${items[items.length - 1].id}` : null, totalMatching: all.length } };
    } catch { return errorResult('Kosakata belum dapat dibaca.'); }
  }

  async search(request: VocabularyPageRequest): Promise<RepositoryResult<VocabularyPage>> {
    try {
      const filtered = (await this.all(request.packageId)).filter((word) => matchesVocabularySearch(word, request.query ?? '') && (!request.theme || word.theme === request.theme) && (!request.register || word.register === request.register));
      const limit = Math.min(Math.max(Math.floor(request.limit) || 20, 1), 50);
      const cursorIndex = request.cursor ? filtered.findIndex((word) => `${word.curriculumOrder}:${word.id}` === request.cursor) : -1;
      if (request.cursor && cursorIndex < 0) return errorResult('Cursor pencarian sudah tidak berlaku.');
      const start = request.cursor ? cursorIndex + 1 : 0;
      const items = filtered.slice(Math.max(start, 0), Math.max(start, 0) + limit);
      return { ok: true, data: { items, nextCursor: items.length === limit ? `${items[items.length - 1].curriculumOrder}:${items[items.length - 1].id}` : null, totalMatching: filtered.length } };
    } catch { return errorResult('Pencarian kosakata belum dapat dilakukan.'); }
  }

  async getFilters(packageId: string): Promise<RepositoryResult<VocabularyFilters>> {
    try {
      const words = await this.all(packageId);
      return { ok: true, data: { themes: [...new Set(words.map((word) => word.theme).filter((theme): theme is string => Boolean(theme)))].sort(), registers: [...new Set(words.map((word) => word.register))].sort() } };
    } catch { return errorResult('Filter kosakata belum dapat dibaca.'); }
  }

  async getWord(packageId: string, itemId: string): Promise<RepositoryResult<VocabularyWord | null>> {
    const result = await this.all(packageId);
    return { ok: true, data: result.find((word) => word.id === itemId) ?? null };
  }
}
