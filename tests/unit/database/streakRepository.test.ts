import { describe, expect, it, beforeEach } from 'vitest';

import { InMemoryDatabaseAdapter } from '../../../src/infrastructure/database/appDatabase';
import {
  getLocalDateString,
  StreakRepository,
  STREAK_TARGET_SCROLLS,
} from '../../../src/infrastructure/database/streakRepository';

describe('StreakRepository', () => {
  let db: InMemoryDatabaseAdapter;
  let repo: StreakRepository;

  beforeEach(() => {
    db = new InMemoryDatabaseAdapter();
    repo = new StreakRepository(db);
  });

  it('starts at 0 scrolls and not completed for today', async () => {
    const streak = await repo.getTodayStreak('jawa-mataraman', '2026-11-01');
    expect(streak.scroll_count).toBe(0);
    expect(streak.is_completed).toBe(0);
    expect(streak.completed_at).toBeNull();
  });

  it('increments scroll count on each scroll and isolates per package', async () => {
    const res1 = await repo.incrementDailyScroll('jawa-mataraman', '2026-11-01');
    expect(res1.streak.scroll_count).toBe(1);
    expect(res1.justCompleted).toBe(false);

    const sunda = await repo.getTodayStreak('sunda-priangan', '2026-11-01');
    expect(sunda.scroll_count).toBe(0); // isolated!
  });

  it('completes streak on 10th scroll and reports justCompleted true only once', async () => {
    for (let i = 1; i < STREAK_TARGET_SCROLLS; i++) {
      const res = await repo.incrementDailyScroll('jawa-mataraman', '2026-11-01');
      expect(res.streak.scroll_count).toBe(i);
      expect(res.justCompleted).toBe(false);
      expect(res.streak.is_completed).toBe(0);
    }

    // 10th scroll
    const res10 = await repo.incrementDailyScroll('jawa-mataraman', '2026-11-01');
    expect(res10.streak.scroll_count).toBe(10);
    expect(res10.justCompleted).toBe(true);
    expect(res10.streak.is_completed).toBe(1);
    expect(res10.streak.completed_at).toBeTruthy();

    // 11th scroll
    const res11 = await repo.incrementDailyScroll('jawa-mataraman', '2026-11-01');
    expect(res11.streak.scroll_count).toBe(11);
    expect(res11.justCompleted).toBe(false);
    expect(res11.streak.is_completed).toBe(1);
  });

  it('formats local date string correctly based on device local time instead of UTC', () => {
    // 2 November 2026 01:30:00 local time
    const testDate = new Date(2026, 10, 2, 1, 30, 0); // month 10 = November
    expect(getLocalDateString(testDate)).toBe('2026-11-02');
  });

  describe('getConsecutiveStreak', () => {
    it('returns 0 when there are no streak records', async () => {
      const count = await repo.getConsecutiveStreak('jawa-mataraman', '2026-11-02');
      expect(count).toBe(0);
    });

    it('returns consecutive days when today is completed', async () => {
      // 3 days consecutive: 2026-10-31, 2026-11-01, 2026-11-02
      for (let i = 0; i < 10; i++) {
        await repo.incrementDailyScroll('jawa-mataraman', '2026-10-31');
      }
      for (let i = 0; i < 10; i++) {
        await repo.incrementDailyScroll('jawa-mataraman', '2026-11-01');
      }
      for (let i = 0; i < 10; i++) {
        await repo.incrementDailyScroll('jawa-mataraman', '2026-11-02');
      }

      const count = await repo.getConsecutiveStreak('jawa-mataraman', '2026-11-02');
      expect(count).toBe(3);
    });

    it('returns streak count from yesterday if today is not yet completed', async () => {
      // Yesterday completed: 2026-11-01
      for (let i = 0; i < 10; i++) {
        await repo.incrementDailyScroll('jawa-mataraman', '2026-11-01');
      }
      // Today 2026-11-02 has 5 scrolls (not yet completed)
      for (let i = 0; i < 5; i++) {
        await repo.incrementDailyScroll('jawa-mataraman', '2026-11-02');
      }

      const count = await repo.getConsecutiveStreak('jawa-mataraman', '2026-11-02');
      expect(count).toBe(1);
    });

    it('returns 0 if yesterday was missed and today is not completed', async () => {
      // Completed on 2026-10-30, but 2026-10-31 and 2026-11-01 were missed
      for (let i = 0; i < 10; i++) {
        await repo.incrementDailyScroll('jawa-mataraman', '2026-10-30');
      }

      const count = await repo.getConsecutiveStreak('jawa-mataraman', '2026-11-02');
      expect(count).toBe(0);
    });
  });
});
