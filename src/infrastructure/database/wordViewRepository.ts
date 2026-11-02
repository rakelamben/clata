import { getAppDatabase } from './appDatabase';
import type { DatabaseAdapter, WordViewRecord } from './databaseTypes';

export class WordViewRepository {
  private dbProvider: () => Promise<DatabaseAdapter>;

  constructor(customDb?: DatabaseAdapter) {
    this.dbProvider = customDb ? async () => customDb : getAppDatabase;
  }

  async recordWordView(packageId: string, wordId: string): Promise<WordViewRecord> {
    const db = await this.dbProvider();
    const existing = await this.getWordView(packageId, wordId);
    const now = new Date().toISOString();

    if (existing) {
      const updated: WordViewRecord = {
        package_id: packageId,
        word_id: wordId,
        view_count: existing.view_count + 1,
        first_viewed_at: existing.first_viewed_at,
        last_viewed_at: now,
      };

      await db.run(
        `INSERT OR REPLACE INTO word_views (package_id, word_id, view_count, first_viewed_at, last_viewed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          updated.package_id,
          updated.word_id,
          updated.view_count,
          updated.first_viewed_at,
          updated.last_viewed_at,
        ],
      );

      return updated;
    }

    const created: WordViewRecord = {
      package_id: packageId,
      word_id: wordId,
      view_count: 1,
      first_viewed_at: now,
      last_viewed_at: now,
    };

    await db.run(
      `INSERT OR REPLACE INTO word_views (package_id, word_id, view_count, first_viewed_at, last_viewed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        created.package_id,
        created.word_id,
        created.view_count,
        created.first_viewed_at,
        created.last_viewed_at,
      ],
    );

    return created;
  }

  async getWordView(packageId: string, wordId: string): Promise<WordViewRecord | null> {
    const db = await this.dbProvider();
    return await db.get<WordViewRecord>(
      'SELECT * FROM word_views WHERE package_id = ? AND word_id = ?',
      [packageId, wordId],
    );
  }

  async getWordViewMap(packageId: string): Promise<Map<string, WordViewRecord>> {
    const db = await this.dbProvider();
    const rows = await db.all<WordViewRecord>(
      'SELECT * FROM word_views WHERE package_id = ?',
      [packageId],
    );

    const map = new Map<string, WordViewRecord>();
    for (const row of rows) {
      map.set(row.word_id, row);
    }
    return map;
  }

  async clearAllWordViews(packageId?: string): Promise<void> {
    const db = await this.dbProvider();
    if (packageId) {
      await db.run('DELETE FROM word_views WHERE package_id = ?', [packageId]);
    } else {
      await db.run('DELETE FROM word_views');
    }
  }
}
