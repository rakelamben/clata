import { describe, expect, it, vi } from 'vitest';
import { ResetPackageProgressUseCase } from '../../../src/features/settings/application/resetPackageProgress';
import type { ProgressRepository } from '../../../src/features/progress/data/progressRepository';

describe('ResetPackageProgressUseCase', () => {
  const fixedTime = '2026-10-29T10:00:00.000Z';
  const fixedId = 'reset_12345';

  it('records reset command and triggers snapshot rebuild', async () => {
    const mockRepo: ProgressRepository = {
      appendEvent: vi.fn(),
      appendEventWithin: vi.fn(),
      getEvents: vi.fn(),
      rebuild: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          packageId: 'jawa-mataraman',
          mastery: 0,
          highestLevel: 0,
          wordStrength: {},
          sentenceStrength: {},
          currentStreak: 0,
          activeDays: [],
          level: 1,
          sessionsStarted: 0,
          sessionsCompleted: 0,
        },
      }),
      resetPackage: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
      rebuildAll: vi.fn(),
    };

    const useCase = new ResetPackageProgressUseCase(
      mockRepo,
      () => fixedTime,
      () => fixedId
    );

    const result = await useCase.execute({ packageId: 'jawa-mataraman' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.success).toBe(true);
    expect(result.data.packageId).toBe('jawa-mataraman');
    expect(result.data.resetAt).toBe(fixedTime);

    expect(mockRepo.resetPackage).toHaveBeenCalledWith(
      'jawa-mataraman',
      fixedId,
      fixedTime
    );
    expect(mockRepo.rebuild).toHaveBeenCalledWith(
      { packageId: 'jawa-mataraman' },
      '2026-10-29'
    );
  });

  it('returns repository error if resetPackage fails', async () => {
    const mockRepo: ProgressRepository = {
      appendEvent: vi.fn(),
      appendEventWithin: vi.fn(),
      getEvents: vi.fn(),
      rebuild: vi.fn(),
      resetPackage: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: 'UNKNOWN', message: 'Database error', recoverable: true },
      }),
      rebuildAll: vi.fn(),
    };

    const useCase = new ResetPackageProgressUseCase(mockRepo);
    const result = await useCase.execute({ packageId: 'jawa-mataraman' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe('Database error');
    expect(mockRepo.rebuild).not.toHaveBeenCalled();
  });
});
