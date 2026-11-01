import { createAppError } from '../../../domain/errors/AppError';
import type { RepositoryResult } from '../../../data/repositories/RepositoryResult';
import type { DatabasePort } from '../DatabasePort';
import type { Migration } from './Migration';
import { migration0001 } from './0001_initial';
import { migration0002 } from './0002_progress_indexes';
import { migration0003 } from './0003_practice_sessions';
import { migration0004 } from './0004_dialogues_and_challenges';
import { migration0005 } from './0005_allow_mixed_practice_sessions';

export async function runMigrations(database: DatabasePort, migrations: Migration[] = [migration0001, migration0002, migration0003, migration0004, migration0005]): Promise<RepositoryResult<void>> {
  try {
    await database.exec('PRAGMA foreign_keys = ON;');
    const current = await database.get<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = Number(current?.user_version ?? 0);
    for (const migration of migrations.filter((candidate) => candidate.version > currentVersion).sort((a, b) => a.version - b.version)) {
      await database.transaction(async (transaction) => {
        await migration.up(transaction);
        await transaction.exec(`PRAGMA user_version = ${migration.version}`);
      });
    }
    return { ok: true, data: undefined };
  } catch (cause) {
    return { ok: false, error: createAppError('MIGRATION_FAILED', 'Database migration gagal. Data lokal tetap dipertahankan.', { recoverable: true, cause }) };
  }
}
