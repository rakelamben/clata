import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import { createAppError } from '../../../domain/errors/AppError';
import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import type { StorageInfo } from '../domain/settingsTypes';

export class GetStorageInfoUseCase {
  constructor(private readonly database: DatabasePort) {}

  async execute(packageId: string = 'jawa-mataraman'): Promise<RepositoryResult<StorageInfo>> {
    try {
      const eventCountRow = await this.database.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM learning_events WHERE package_id = ?',
        [packageId]
      );
      const learnedCountRow = await this.database.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM item_strength_cache WHERE package_id = ?',
        [packageId]
      );
      const pageCountRow = await this.database.get<{ page_count: number }>(
        'PRAGMA page_count'
      );
      const pageSizeRow = await this.database.get<{ page_size: number }>(
        'PRAGMA page_size'
      );

      const pageCount = Number(pageCountRow?.page_count ?? 100);
      const pageSize = Number(pageSizeRow?.page_size ?? 4096);
      const bytes = pageCount * pageSize;

      const formatted =
        bytes > 1024 * 1024
          ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(bytes / 1024)} KB`;

      return {
        ok: true,
        data: {
          databaseSizeBytes: bytes,
          databaseSizeFormatted: formatted,
          packageId,
          packageName: 'Jawa (Mataraman)',
          packageVersion: '1.0.0',
          totalEventsCount: Number(eventCountRow?.count ?? 0),
          learnedItemsCount: Number(learnedCountRow?.count ?? 0),
        },
      };
    } catch (cause) {
      return {
        ok: false,
        error: createAppError('UNKNOWN', 'Gagal memuat ringkasan penyimpanan.', {
          recoverable: true,
          cause,
        }),
      };
    }
  }
}
