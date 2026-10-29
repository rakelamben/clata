import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { DatabasePort, DatabaseTransaction } from './DatabasePort';

class ExpoSQLiteDatabase implements DatabasePort {
  private webQueue: Promise<void> = Promise.resolve();
  constructor(private readonly database: SQLite.SQLiteDatabase) {}

  async exec(sql: string) { await this.database.execAsync(sql); }
  async run(sql: string, params: readonly unknown[] = []) {
    const result = await this.database.runAsync(sql, params as SQLite.SQLiteBindParams);
    return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
  }
  async get<T extends Record<string, unknown>>(sql: string, params: readonly unknown[] = []) {
    return this.database.getFirstAsync<T>(sql, params as SQLite.SQLiteBindParams);
  }
  async all<T extends Record<string, unknown>>(sql: string, params: readonly unknown[] = []) {
    return this.database.getAllAsync<T>(sql, params as SQLite.SQLiteBindParams);
  }
  async transaction<T>(work: (transaction: DatabaseTransaction) => Promise<T>) {
    let result!: T;
    if (Platform.OS === 'web') {
      const run = this.webQueue.then(async () => {
        await this.database.withTransactionAsync(async () => { result = await work(this); });
      });
      this.webQueue = run.then(() => undefined, () => undefined);
      await run;
    } else {
      await this.database.withExclusiveTransactionAsync(async (txn) => { result = await work(new ExpoSQLiteDatabase(txn)); });
    }
    return result;
  }
  async close() { await this.database.closeAsync(); }
}

export async function openExpoSQLiteDatabase(name = 'clata.db'): Promise<DatabasePort> {
  const database = await SQLite.openDatabaseAsync(name);
  const adapter = new ExpoSQLiteDatabase(database);
  await adapter.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  return adapter;
}
