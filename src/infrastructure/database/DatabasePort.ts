export type DatabaseRow = Record<string, unknown>;

export type DatabaseTransaction = DatabasePort;

export interface DatabasePort {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: readonly unknown[]): Promise<{ changes: number; lastInsertRowId?: number }>;
  get<T extends DatabaseRow = DatabaseRow>(sql: string, params?: readonly unknown[]): Promise<T | null>;
  all<T extends DatabaseRow = DatabaseRow>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  transaction<T>(work: (transaction: DatabaseTransaction) => Promise<T>): Promise<T>;
  close?(): Promise<void>;
}
