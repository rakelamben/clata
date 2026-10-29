import { describe, expect, it, vi } from 'vitest';
import { ClearAllLocalDataUseCase } from '../../../src/features/settings/application/clearAllLocalData';
import type { DatabasePort } from '../../../src/infrastructure/database/DatabasePort';
import type { SettingsRepository } from '../../../src/features/settings/data/settingsRepository';

describe('ClearAllLocalDataUseCase', () => {
  const fixedTime = '2026-10-29T12:00:00.000Z';

  it('purges all learning and state tables in a single transaction and clears settings', async () => {
    const executedQueries: string[] = [];
    const mockTransaction = {
      run: vi.fn().mockImplementation((sql: string) => {
        executedQueries.push(sql);
        return Promise.resolve({ rowsAffected: 1 });
      }),
      get: vi.fn(),
      all: vi.fn(),
    };

    const mockDb: DatabasePort = {
      exec: vi.fn(),
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      transaction: vi.fn().mockImplementation(async (work) => {
        await work(mockTransaction);
      }),
    };

    const mockSettings: SettingsRepository = {
      get: vi.fn(),
      set: vi.fn(),
      clearAll: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new ClearAllLocalDataUseCase(
      mockDb,
      mockSettings,
      () => fixedTime
    );

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.success).toBe(true);
    expect(result.data.clearedAt).toBe(fixedTime);

    expect(mockDb.transaction).toHaveBeenCalled();
    expect(executedQueries).toContain('DELETE FROM learning_events');
    expect(executedQueries).toContain('DELETE FROM reset_commands');
    expect(executedQueries).toContain('DELETE FROM package_reset_boundaries');
    expect(executedQueries).toContain('DELETE FROM item_strength_cache');
    expect(executedQueries).toContain('DELETE FROM dialogue_scores');
    expect(executedQueries).toContain('DELETE FROM active_dialogue_runs');
    expect(executedQueries).toContain('DELETE FROM challenge_checks');
    expect(executedQueries).toContain('DELETE FROM highest_levels');
    expect(executedQueries).toContain('DELETE FROM sync_outbox');
    expect(executedQueries).toContain('DELETE FROM rebuild_markers');
    expect(executedQueries).toContain(
      'UPDATE app_event_sequence SET next_sequence = 1 WHERE singleton_id = 1'
    );
    expect(mockSettings.clearAll).toHaveBeenCalled();
  });

  it('returns an error if the transaction fails', async () => {
    const mockDb: DatabasePort = {
      exec: vi.fn(),
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      transaction: vi.fn().mockRejectedValue(new Error('Disk I/O error')),
    };

    const mockSettings: SettingsRepository = {
      get: vi.fn(),
      set: vi.fn(),
      clearAll: vi.fn(),
    };

    const useCase = new ClearAllLocalDataUseCase(mockDb, mockSettings);
    const result = await useCase.execute();

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.message).toContain('Gagal membersihkan seluruh data lokal');
    expect(mockSettings.clearAll).not.toHaveBeenCalled();
  });
});
