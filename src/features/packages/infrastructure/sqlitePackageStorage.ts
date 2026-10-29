import type { PackageStorage } from '../application/installPackage';
import type { PackageArchiveEntry, PackageIdentity, PackageInstallState } from '../domain/packageTypes';
import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import { sha256 } from '@noble/hashes/sha2.js';

type Staged = { identity: PackageIdentity; entries: PackageArchiveEntry[] };

export class SQLitePackageStorage implements PackageStorage {
  constructor(private readonly getDatabase: () => Promise<DatabasePort>, private readonly now: () => string = () => new Date().toISOString()) {}

  async getActive(packageId: string) {
    const database = await this.getDatabase();
    const row = await database.get<Record<string, unknown>>('SELECT package_id, language_id, dialect_id, package_version, schema_version FROM installed_packages WHERE package_id = ? AND install_state = ?', [packageId, 'active']);
    return row ? { packageId: String(row.package_id), languageId: String(row.language_id), dialectId: String(row.dialect_id), packageVersion: String(row.package_version), schemaVersion: Number(row.schema_version) } : null;
  }

  async stage(identity: PackageIdentity, entries: PackageArchiveEntry[]) {
    const database = await this.getDatabase();
    const installationId = `${identity.packageId}:${identity.packageVersion}`;
    await database.transaction(async (transaction) => {
      await transaction.run('INSERT OR REPLACE INTO package_installations(installation_id, package_id, target_version, staging_path, archive_checksum, state, commit_marker, archive_size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [installationId, identity.packageId, identity.packageVersion, `staging/${installationId}`, 'pending', 'staging', installationId, entries.reduce((sum, entry) => sum + entry.data.byteLength, 0), this.now()]);
      await transaction.run('INSERT OR REPLACE INTO app_metadata(key, value_json, updated_at) VALUES (?, ?, ?)', [`package_staging:${identity.packageId}`, JSON.stringify({ identity, entries: entries.map((entry) => ({ path: entry.path, data: Array.from(entry.data), archiveSizeBytes: entry.archiveSizeBytes })) }), this.now()]);
    });
  }

  async activate(packageId: string) {
    const database = await this.getDatabase();
    const row = await database.get<{ value_json: string }>('SELECT value_json FROM app_metadata WHERE key = ?', [`package_staging:${packageId}`]);
    if (!row) throw new Error('Package staging tidak ditemukan.');
    const staged = JSON.parse(row.value_json) as Staged;
    staged.entries = staged.entries.map((entry) => ({
      ...entry,
      data: entry.data instanceof Uint8Array ? entry.data : Uint8Array.from(entry.data as unknown as number[]),
    }));
    await database.transaction(async (transaction) => {
      const previous = await transaction.get<{ package_version: string }>('SELECT package_version FROM installed_packages WHERE package_id = ? AND install_state = ?', [packageId, 'active']);
      const archiveBytes = staged.entries.reduce((total, entry) => total + entry.data.byteLength, 0);
      const archiveChecksum = toHex(sha256(concat(staged.entries.map((entry) => entry.data))));
      const signatureKeyId = readSignatureKeyId(staged.entries);
      if (previous) {
        await transaction.run('UPDATE installed_packages SET language_id = ?, dialect_id = ?, package_version = ?, schema_version = ?, source = ?, install_state = ?, installed_at = ?, updated_at = ? WHERE package_id = ?', [staged.identity.languageId, staged.identity.dialectId, staged.identity.packageVersion, staged.identity.schemaVersion, 'bundled', 'active', this.now(), this.now(), packageId]);
      } else {
        await transaction.run('INSERT INTO installed_packages(package_id, language_id, dialect_id, package_version, schema_version, source, install_state, installed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [staged.identity.packageId, staged.identity.languageId, staged.identity.dialectId, staged.identity.packageVersion, staged.identity.schemaVersion, 'bundled', 'active', this.now(), this.now()]);
      }
      await transaction.run('INSERT OR REPLACE INTO package_archives(package_id, package_version, archive_checksum, archive_size_bytes, archive_path, signature_key_id, original_filename, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [packageId, staged.identity.packageVersion, archiveChecksum, archiveBytes, `packages/${packageId}/${staged.identity.packageVersion}.clata`, signatureKeyId, `${packageId}-${staged.identity.packageVersion}.clata`, this.now()]);
      await transaction.run('DELETE FROM units WHERE package_id = ?', [packageId]);
      await transaction.run('DELETE FROM words WHERE package_id = ?', [packageId]);
      await transaction.run('DELETE FROM sentences WHERE package_id = ?', [packageId]);
      await transaction.run('DELETE FROM dialogues WHERE package_id = ?', [packageId]);
      await transaction.run('DELETE FROM challenges WHERE package_id = ?', [packageId]);
      for (const entry of staged.entries) {
        await transaction.run('INSERT INTO package_archive_entries(package_id, package_version, path, data) VALUES (?, ?, ?, ?)', [packageId, staged.identity.packageVersion, entry.path, entry.data instanceof Uint8Array ? entry.data : Uint8Array.from(entry.data as unknown as number[])]);
      }
      await persistContent(transaction, packageId, staged.identity.packageVersion, staged.entries);
      const sequence = await transaction.get<{ next_sequence: number }>('SELECT next_sequence FROM app_event_sequence WHERE singleton_id = 1');
      const localSequence = Number(sequence?.next_sequence ?? 1);
      await transaction.run('UPDATE app_event_sequence SET next_sequence = ? WHERE singleton_id = 1', [localSequence + 1]);
      await transaction.run('INSERT INTO learning_events(event_id, local_sequence, device_id, package_id, event_type, source, weight, device_time, received_time, local_date, formula_version, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [`package-updated:${packageId}:${staged.identity.packageVersion}`, localSequence, 'system', packageId, 'package_updated', 'system', 1, this.now(), this.now(), this.now().slice(0, 10), 1, JSON.stringify({ packageId, fromVersion: previous?.package_version, toVersion: staged.identity.packageVersion, archiveChecksum })]);
      await transaction.run('DELETE FROM app_metadata WHERE key = ?', [`package_staging:${packageId}`]);
      await transaction.run('DELETE FROM package_installations WHERE package_id = ?', [packageId]);
    });
  }

  async discardStaging(packageId: string) {
    const database = await this.getDatabase();
    await database.run('DELETE FROM app_metadata WHERE key = ?', [`package_staging:${packageId}`]);
  }

  async getInstallState(packageId: string): Promise<PackageInstallState | null> {
    const database = await this.getDatabase();
    const staging = await database.get('SELECT key FROM app_metadata WHERE key = ?', [`package_staging:${packageId}`]);
    if (staging) return 'staged';
    const active = await this.getActive(packageId);
    return active ? 'active' : null;
  }

  async recover() {
    const database = await this.getDatabase();
    const markers = await database.all<{ key: string; value_json: string }>("SELECT key, value_json FROM app_metadata WHERE key LIKE 'package_staging:%'");
    for (const marker of markers) {
      const packageId = marker.key.slice('package_staging:'.length);
      try {
        const staged = JSON.parse(marker.value_json) as Staged;
        staged.entries = staged.entries.map((entry) => ({ ...entry, data: entry.data instanceof Uint8Array ? entry.data : Uint8Array.from(entry.data as unknown as number[]) }));
        if (!staged.identity?.packageId || staged.identity.packageId !== packageId || !Array.isArray(staged.entries)) throw new Error('Marker tidak valid');
        await this.activate(packageId);
      } catch {
        await database.transaction(async (transaction) => {
          await transaction.run('DELETE FROM app_metadata WHERE key = ?', [marker.key]);
          await transaction.run('DELETE FROM package_installations WHERE package_id = ?', [packageId]);
        });
      }
    }
  }
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const normalized = chunks.map((chunk) => (chunk instanceof Uint8Array ? chunk : Uint8Array.from(chunk as unknown as number[])));
  const total = normalized.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of normalized) { output.set(chunk, offset); offset += chunk.byteLength; }
  return output;
}

function toHex(bytes: Uint8Array): string { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''); }
function hashText(value: string): string { return toHex(sha256(new TextEncoder().encode(value))); }

async function persistContent(database: { run(sql: string, params?: readonly unknown[]): Promise<unknown> }, packageId: string, packageVersion: string, entries: PackageArchiveEntry[]) {
  const files = new Map(entries.map((entry) => [entry.path, entry.data]));
  const json = (path: string): unknown[] => {
    const data = files.get(path);
    if (!data) return [];
    try { const parsed = JSON.parse(new TextDecoder().decode(data)); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return []; }
  };
  const now = new Date().toISOString();
  for (const unit of json('unit.json')) await database.run('INSERT OR REPLACE INTO units(package_id, item_id, unit_order, title, payload_json) VALUES (?, ?, ?, ?, ?)', [packageId, String((unit as Record<string, unknown>).unit_id), Number((unit as Record<string, unknown>).order ?? 0), String((unit as Record<string, unknown>).title ?? ''), JSON.stringify(unit)]);
  for (const word of json('kata.json')) await database.run('INSERT OR REPLACE INTO words(package_id, item_id, unit_id, item_order, register, meaning_fingerprint, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?)', [packageId, String((word as Record<string, unknown>).id), String((word as Record<string, unknown>).unit_id ?? ''), Number((word as Record<string, unknown>).order ?? 0), String((word as Record<string, unknown>).register ?? ''), hashText(JSON.stringify((word as Record<string, unknown>).meaning ?? '')), JSON.stringify(word)]);
  for (const sentence of json('kalimat.json')) await database.run('INSERT OR REPLACE INTO sentences(package_id, item_id, unit_id, item_order, meaning_fingerprint, payload_json) VALUES (?, ?, ?, ?, ?, ?)', [packageId, String((sentence as Record<string, unknown>).id), String((sentence as Record<string, unknown>).unit_id ?? ''), Number((sentence as Record<string, unknown>).order ?? 0), hashText(JSON.stringify((sentence as Record<string, unknown>).meaning ?? '')), JSON.stringify(sentence)]);
  for (const dialogue of json('dialog.json')) {
    const dialogueId = String((dialogue as Record<string, unknown>).id);
    const fingerprint = hashText(JSON.stringify(dialogue));
    const payload = JSON.stringify(dialogue);
    await database.run('INSERT OR REPLACE INTO dialogues(package_id, item_id, unit_id, item_order, graph_fingerprint, payload_json) VALUES (?, ?, ?, ?, ?, ?)', [packageId, dialogueId, String((dialogue as Record<string, unknown>).unit_id ?? ''), Number((dialogue as Record<string, unknown>).order ?? 0), fingerprint, payload]);
    await database.run('INSERT OR REPLACE INTO dialogue_graph_snapshots(package_id, package_version, dialogue_id, graph_fingerprint, graph_json) VALUES (?, ?, ?, ?, ?)', [packageId, packageVersion, dialogueId, fingerprint, payload]);
  }
  for (const challenge of json('challenge.json')) await database.run('INSERT OR REPLACE INTO challenges(package_id, item_id, unit_id, item_order, payload_json) VALUES (?, ?, ?, ?, ?)', [packageId, String((challenge as Record<string, unknown>).id), String((challenge as Record<string, unknown>).unit_id ?? ''), Number((challenge as Record<string, unknown>).order ?? 0), JSON.stringify(challenge)]);
  await database.run('INSERT OR IGNORE INTO package_item_introductions(package_id, package_version, item_id, item_type, meaning_fingerprint, introduced_at) SELECT package_id, ?, item_id, \'word\', meaning_fingerprint, ? FROM words WHERE package_id = ?', [packageVersion, now, packageId]);
}

function readSignatureKeyId(entries: PackageArchiveEntry[]): string {
  const entry = entries.find((candidate) => candidate.path === 'tanda-tangan' || candidate.path === 'tanda-tangan.json');
  if (!entry) return 'unknown';
  try { return String((JSON.parse(new TextDecoder().decode(entry.data)) as Record<string, unknown>).key_id ?? 'unknown'); } catch { return 'unknown'; }
}
