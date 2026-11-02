import { getAppDatabase } from './appDatabase';
import type { ChallengeProgressRecord, DatabaseAdapter } from './databaseTypes';

export class ChallengeRepository {
  private dbProvider: () => Promise<DatabaseAdapter>;

  constructor(customDb?: DatabaseAdapter) {
    this.dbProvider = customDb ? async () => customDb : getAppDatabase;
  }

  /**
   * Mengambil progres satu tantangan tertentu
   */
  async getChallengeProgress(
    packageId: string,
    challengeId: string,
  ): Promise<ChallengeProgressRecord | null> {
    const db = await this.dbProvider();
    return await db.get<ChallengeProgressRecord>(
      `SELECT package_id, challenge_id, is_completed, completed_variant, completed_at
       FROM challenge_progress
       WHERE package_id = ? AND challenge_id = ?`,
      [packageId, challengeId],
    );
  }

  /**
   * Mengambil peta seluruh progres tantangan untuk satu paket
   */
  async getChallengeProgressMap(
    packageId: string,
  ): Promise<Record<string, ChallengeProgressRecord>> {
    const db = await this.dbProvider();
    const rows = await db.all<ChallengeProgressRecord>(
      `SELECT package_id, challenge_id, is_completed, completed_variant, completed_at
       FROM challenge_progress
       WHERE package_id = ?`,
      [packageId],
    );

    const map: Record<string, ChallengeProgressRecord> = {};
    for (const row of rows) {
      map[row.challenge_id] = row;
    }
    return map;
  }

  /**
   * Mengubah status centang tantangan (selesai <-> belum selesai)
   */
  async toggleChallenge(
    packageId: string,
    challengeId: string,
    variant: 'solo' | 'social' = 'solo',
  ): Promise<ChallengeProgressRecord> {
    const db = await this.dbProvider();
    const existing = await this.getChallengeProgress(packageId, challengeId);

    const nextIsCompleted = existing && existing.is_completed === 1 ? 0 : 1;
    const now = nextIsCompleted === 1 ? new Date().toISOString() : null;

    const record: ChallengeProgressRecord = {
      package_id: packageId,
      challenge_id: challengeId,
      is_completed: nextIsCompleted,
      completed_variant: variant,
      completed_at: now,
    };

    await db.run(
      `INSERT OR REPLACE INTO challenge_progress (
         package_id, challenge_id, is_completed, completed_variant, completed_at
       ) VALUES (?, ?, ?, ?, ?)`,
      [
        record.package_id,
        record.challenge_id,
        record.is_completed,
        record.completed_variant,
        record.completed_at,
      ],
    );

    return record;
  }

  /**
   * Mengatur ulang status tantangan agar kembali ke belum selesai
   */
  async resetChallenge(packageId: string, challengeId: string): Promise<void> {
    const db = await this.dbProvider();
    await db.run(
      `DELETE FROM challenge_progress
       WHERE package_id = ? AND challenge_id = ?`,
      [packageId, challengeId],
    );
  }
}
