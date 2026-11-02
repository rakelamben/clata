import { getAppDatabase } from './appDatabase';
import type { DatabaseAdapter, DailyStreakRecord } from './databaseTypes';

export const STREAK_TARGET_SCROLLS = 10;

/**
 * Mengambil tanggal lokal perangkat pengguna dalam format YYYY-MM-DD.
 * Tidak menggunakan toISOString() karena toISOString() berbasis UTC (GMT+0)
 * yang menyebabkan pergantian hari terlambat hingga jam 7 pagi pada WIB (GMT+7).
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  return getLocalDateString();
}

export function getPreviousDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const prevY = date.getFullYear();
  const prevM = String(date.getMonth() + 1).padStart(2, '0');
  const prevD = String(date.getDate()).padStart(2, '0');
  return `${prevY}-${prevM}-${prevD}`;
}

export class StreakRepository {
  private dbProvider: () => Promise<DatabaseAdapter>;

  constructor(customDb?: DatabaseAdapter) {
    this.dbProvider = customDb ? async () => customDb : getAppDatabase;
  }

  async getTodayStreak(packageId: string, customDate?: string): Promise<DailyStreakRecord> {
    const db = await this.dbProvider();
    const dateStr = customDate ?? getTodayString();
    const existing = await db.get<DailyStreakRecord>(
      'SELECT * FROM daily_streaks WHERE package_id = ? AND date_string = ?',
      [packageId, dateStr],
    );

    if (existing) {
      return existing;
    }

    return {
      package_id: packageId,
      date_string: dateStr,
      scroll_count: 0,
      is_completed: 0,
      completed_at: null,
    };
  }

  async incrementDailyScroll(
    packageId: string,
    customDate?: string,
  ): Promise<{ streak: DailyStreakRecord; justCompleted: boolean }> {
    const db = await this.dbProvider();
    const dateStr = customDate ?? getTodayString();
    const current = await this.getTodayStreak(packageId, dateStr);

    const newCount = current.scroll_count + 1;
    const previouslyCompleted = current.is_completed === 1;
    const nowCompleted = newCount >= STREAK_TARGET_SCROLLS;
    const justCompleted = !previouslyCompleted && nowCompleted;

    const completedAt = nowCompleted
      ? current.completed_at ?? new Date().toISOString()
      : null;

    const updated: DailyStreakRecord = {
      package_id: packageId,
      date_string: dateStr,
      scroll_count: newCount,
      is_completed: nowCompleted ? 1 : 0,
      completed_at: completedAt,
    };

    await db.run(
      `INSERT OR REPLACE INTO daily_streaks (package_id, date_string, scroll_count, is_completed, completed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        updated.package_id,
        updated.date_string,
        updated.scroll_count,
        updated.is_completed,
        updated.completed_at,
      ],
    );

    return {
      streak: updated,
      justCompleted,
    };
  }

  /**
   * Menghitung total hari streak beruntun yang aktif untuk paket ini.
   * Jika hari ini sudah selesai, hitung hari ini mundur ke hari-hari sebelumnya.
   * Jika hari ini belum selesai tetapi kemarin selesai, streak belum putus (hitung mundur dari kemarin).
   * Jika kemarin tidak selesai, streak bernilai 0.
   */
  async getConsecutiveStreak(packageId: string, customDate?: string): Promise<number> {
    const db = await this.dbProvider();
    const rows = await db.all<{ date_string: string }>(
      'SELECT date_string FROM daily_streaks WHERE package_id = ? AND is_completed = 1',
      [packageId],
    );

    if (!rows || rows.length === 0) {
      return 0;
    }

    const completedSet = new Set(rows.map((r) => r.date_string));
    const today = customDate ?? getTodayString();
    const yesterday = getPreviousDateString(today);

    let currentCheckDate: string | null = null;

    if (completedSet.has(today)) {
      currentCheckDate = today;
    } else if (completedSet.has(yesterday)) {
      currentCheckDate = yesterday;
    } else {
      return 0;
    }

    let count = 0;
    while (currentCheckDate && completedSet.has(currentCheckDate)) {
      count += 1;
      currentCheckDate = getPreviousDateString(currentCheckDate);
    }

    return count;
  }

  async clearAllStreaks(packageId?: string): Promise<void> {
    const db = await this.dbProvider();
    if (packageId) {
      await db.run('DELETE FROM daily_streaks WHERE package_id = ?', [packageId]);
    } else {
      await db.run('DELETE FROM daily_streaks');
    }
  }
}
