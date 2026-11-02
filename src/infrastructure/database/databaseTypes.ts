export interface AppSettingsRecord {
  key: string;
  value: string;
}

export interface InstalledPackageDbRecord {
  package_id: string;
  language_id: string;
  dialect_id: string;
  package_version: string;
  schema_version: number;
  title: string;
  bundle_path: string;
  installed_at: string;
  is_active: number; // 1 = active, 0 = inactive
}

export interface WordViewRecord {
  package_id: string;
  word_id: string;
  view_count: number;
  first_viewed_at: string;
  last_viewed_at: string;
}

export interface DailyStreakRecord {
  package_id: string;
  date_string: string; // YYYY-MM-DD
  scroll_count: number;
  is_completed: number; // 1 = true, 0 = false
  completed_at: string | null;
}

export interface UnitSessionProgressRecord {
  package_id: string;
  unit_id: string;
  session_id: string;
  is_completed: number; // 1 = true, 0 = false
  score_percentage: number;
  completed_at: string | null;
}

export interface ChallengeProgressRecord {
  package_id: string;
  challenge_id: string;
  is_completed: number;
  completed_variant: 'solo' | 'social';
  completed_at: string | null;
}

export interface DatabaseAdapter {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId?: number }>;
  get<T>(sql: string, params?: unknown[]): Promise<T | null>;
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}
