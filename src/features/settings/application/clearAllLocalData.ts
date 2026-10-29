import { createAppError } from '../../../domain/errors/AppError';
import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import type { SettingsRepository } from '../data/settingsRepository';

export interface ClearAllLocalDataOutput {
  success: boolean;
  clearedAt: string;
}

export class ClearAllLocalDataUseCase {
  constructor(
    private readonly database: DatabasePort,
    private readonly settingsRepository: SettingsRepository,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async execute(): Promise<RepositoryResult<ClearAllLocalDataOutput>> {
    try {
      await this.database.transaction(async (transaction) => {
        await transaction.run('DELETE FROM learning_events');
        await transaction.run('DELETE FROM reset_commands');
        await transaction.run('DELETE FROM package_reset_boundaries');
        await transaction.run('DELETE FROM item_strength_cache');
        await transaction.run('DELETE FROM dialogue_scores');
        await transaction.run('DELETE FROM active_dialogue_runs');
        await transaction.run('DELETE FROM challenge_checks');
        await transaction.run('DELETE FROM highest_levels');
        await transaction.run('DELETE FROM sync_outbox');
        await transaction.run('DELETE FROM rebuild_markers');
        await transaction.run(
          'UPDATE app_event_sequence SET next_sequence = 1 WHERE singleton_id = 1'
        );
      });

      if (this.settingsRepository.clearAll) {
        await this.settingsRepository.clearAll();
      }

      return {
        ok: true,
        data: {
          success: true,
          clearedAt: this.now(),
        },
      };
    } catch (cause) {
      return {
        ok: false,
        error: createAppError(
          'UNKNOWN',
          'Gagal membersihkan seluruh data lokal.',
          { recoverable: true, cause }
        ),
      };
    }
  }
}
