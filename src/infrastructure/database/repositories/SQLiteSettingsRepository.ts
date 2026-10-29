import type { DatabasePort } from '../DatabasePort';
import type { SettingsRepository } from '../../../features/settings/data/settingsRepository';

export class SQLiteSettingsRepository implements SettingsRepository {
  constructor(private readonly getDatabase: () => Promise<DatabasePort>, private readonly now: () => string = () => new Date().toISOString()) {}

  async get<T>(key: string): Promise<T | null> {
    const row = await (await this.getDatabase()).get<{ value_json: string }>('SELECT value_json FROM settings WHERE key = ?', [key]);
    if (!row) return null;
    try { return JSON.parse(row.value_json) as T; } catch { return null; }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await (await this.getDatabase()).run('INSERT OR REPLACE INTO settings(key, value_json, updated_at, local_only) VALUES (?, ?, ?, 1)', [key, JSON.stringify(value), this.now()]);
  }

  async clearAll(): Promise<void> {
    await (await this.getDatabase()).run('DELETE FROM settings');
  }
}
