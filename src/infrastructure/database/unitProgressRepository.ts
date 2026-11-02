import { getAppDatabase } from './appDatabase';
import type { DatabaseAdapter, UnitSessionProgressRecord } from './databaseTypes';

export class UnitProgressRepository {
  private dbProvider: () => Promise<DatabaseAdapter>;

  constructor(customDb?: DatabaseAdapter) {
    this.dbProvider = customDb ? async () => customDb : getAppDatabase;
  }

  /**
   * Mengambil progres satu sesi tertentu
   */
  async getUnitSessionProgress(
    packageId: string,
    unitId: string,
    sessionId: string,
  ): Promise<UnitSessionProgressRecord | null> {
    const db = await this.dbProvider();
    return await db.get<UnitSessionProgressRecord>(
      `SELECT package_id, unit_id, session_id, is_completed, score_percentage, completed_at
       FROM unit_session_progress
       WHERE package_id = ? AND unit_id = ? AND session_id = ?`,
      [packageId, unitId, sessionId],
    );
  }

  /**
   * Mengambil peta seluruh progres sesi pada unit tertentu
   */
  async getUnitProgress(
    packageId: string,
    unitId: string,
  ): Promise<Record<string, UnitSessionProgressRecord>> {
    const db = await this.dbProvider();
    const rows = await db.all<UnitSessionProgressRecord>(
      `SELECT package_id, unit_id, session_id, is_completed, score_percentage, completed_at
       FROM unit_session_progress
       WHERE package_id = ? AND unit_id = ?`,
      [packageId, unitId],
    );

    const map: Record<string, UnitSessionProgressRecord> = {};
    for (const row of rows) {
      map[row.session_id] = row;
    }
    return map;
  }

  /**
   * Mengambil seluruh progres sesi unit untuk suatu paket
   */
  async getAllUnitProgress(
    packageId: string,
  ): Promise<Record<string, UnitSessionProgressRecord>> {
    const db = await this.dbProvider();
    const rows = await db.all<UnitSessionProgressRecord>(
      `SELECT package_id, unit_id, session_id, is_completed, score_percentage, completed_at
       FROM unit_session_progress
       WHERE package_id = ?`,
      [packageId],
    );

    const map: Record<string, UnitSessionProgressRecord> = {};
    for (const row of rows) {
      map[`${row.unit_id}:${row.session_id}`] = row;
    }
    return map;
  }

  /**
   * Menyimpan penyelesaian sesi ke SQLite
   */
  async recordSessionCompletion(
    packageId: string,
    unitId: string,
    sessionId: string,
    scorePercentage = 100,
  ): Promise<UnitSessionProgressRecord> {
    const db = await this.dbProvider();
    const now = new Date().toISOString();

    const record: UnitSessionProgressRecord = {
      package_id: packageId,
      unit_id: unitId,
      session_id: sessionId,
      is_completed: 1,
      score_percentage: Math.max(0, Math.min(100, Math.round(scorePercentage))),
      completed_at: now,
    };

    await db.run(
      `INSERT OR REPLACE INTO unit_session_progress (
         package_id, unit_id, session_id, is_completed, score_percentage, completed_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.package_id,
        record.unit_id,
        record.session_id,
        record.is_completed,
        record.score_percentage,
        record.completed_at,
      ],
    );

    return record;
  }

  /**
   * Menghitung rangkuman sesi selesai dan persentase unit
   */
  async getUnitSummary(
    packageId: string,
    unitId: string,
    totalSessionsCount: number,
  ): Promise<{ completedCount: number; percentage: number }> {
    const progressMap = await this.getUnitProgress(packageId, unitId);
    let completedCount = 0;
    for (const record of Object.values(progressMap)) {
      if (record.is_completed === 1) {
        completedCount++;
      }
    }

    const percentage =
      totalSessionsCount > 0
        ? Math.min(100, Math.round((completedCount / totalSessionsCount) * 100))
        : 0;

    return { completedCount, percentage };
  }

  /**
   * Mengambil peta ID sesi selesai untuk seluruh unit dalam suatu paket
   */
  async getCompletedSessionsByPackage(
    packageId: string,
  ): Promise<Record<string, Set<string>>> {
    const db = await this.dbProvider();
    const rows = await db.all<UnitSessionProgressRecord>(
      `SELECT package_id, unit_id, session_id, is_completed, score_percentage, completed_at
       FROM unit_session_progress
       WHERE package_id = ?`,
      [packageId],
    );

    const result: Record<string, Set<string>> = {};
    for (const row of rows) {
      if (row.is_completed === 1) {
        if (!result[row.unit_id]) {
          result[row.unit_id] = new Set();
        }
        result[row.unit_id].add(row.session_id);
      }
    }
    return result;
  }
}
