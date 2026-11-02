import type { DatabaseAdapter } from './databaseTypes';

/**
 * Inisialisasi skema database dan jalankan migrasi otomatis jika tabel lama ditemukan.
 */
export async function initializeDatabaseSchema(db: DatabaseAdapter): Promise<void> {
  // 1. Pastikan tabel app_settings tersedia
  await db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 2. Pastikan tabel word_views tersedia (pelacakan kata yang pernah dilihat)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS word_views (
      package_id TEXT NOT NULL,
      word_id TEXT NOT NULL,
      view_count INTEGER NOT NULL DEFAULT 1,
      first_viewed_at TEXT NOT NULL,
      last_viewed_at TEXT NOT NULL,
      PRIMARY KEY (package_id, word_id)
    );
  `);

  // 3. Pastikan tabel daily_streaks tersedia (pelacakan streak harian per paket bahasa)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_streaks (
      package_id TEXT NOT NULL,
      date_string TEXT NOT NULL,
      scroll_count INTEGER NOT NULL DEFAULT 0,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      PRIMARY KEY (package_id, date_string)
    );
  `);

  // 4. Pastikan tabel package_contents tersedia (persistensi konten paket terpasang)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS package_contents (
      package_id TEXT PRIMARY KEY,
      content_json TEXT NOT NULL,
      archive_bytes BLOB,
      updated_at TEXT NOT NULL
    );
  `);

  // 5. Pastikan tabel unit_session_progress tersedia (pelacakan sesi unit latihan)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS unit_session_progress (
      package_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      score_percentage INTEGER DEFAULT 0,
      completed_at TEXT,
      PRIMARY KEY (package_id, unit_id, session_id)
    );
  `);

  // 6. Pastikan tabel challenge_progress tersedia (pelacakan status selesai tantangan)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS challenge_progress (
      package_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_variant TEXT NOT NULL DEFAULT 'solo',
      completed_at TEXT,
      PRIMARY KEY (package_id, challenge_id)
    );
  `);

  // 7. Periksa skema tabel installed_packages
  try {
    const columns = await db.all<{ name: string }>('PRAGMA table_info(installed_packages)');

    if (!columns || columns.length === 0) {
      // Tabel belum ada, buat langsung dengan skema V2
      await db.exec(`
        CREATE TABLE IF NOT EXISTS installed_packages (
          package_id TEXT PRIMARY KEY,
          language_id TEXT NOT NULL,
          dialect_id TEXT NOT NULL,
          package_version TEXT NOT NULL,
          schema_version INTEGER NOT NULL,
          title TEXT NOT NULL,
          bundle_path TEXT NOT NULL,
          installed_at TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 0
        );
      `);
      return;
    }

    const colNames = new Set(columns.map((c) => c.name.toLowerCase()));

    // Migrasi in-place via ALTER TABLE: cepat, atomik, dan tidak mengunci tabel
    if (!colNames.has('title')) {
      await db.exec("ALTER TABLE installed_packages ADD COLUMN title TEXT NOT NULL DEFAULT '';");
    }
    if (!colNames.has('bundle_path')) {
      await db.exec("ALTER TABLE installed_packages ADD COLUMN bundle_path TEXT NOT NULL DEFAULT '';");
    }
    if (!colNames.has('is_active')) {
      await db.exec('ALTER TABLE installed_packages ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0;');
    }
  } catch (err) {
    console.warn('[Database] Peringatan saat inisialisasi skema database:', err);
    await db.exec(`
      CREATE TABLE IF NOT EXISTS installed_packages (
        package_id TEXT PRIMARY KEY,
        language_id TEXT NOT NULL,
        dialect_id TEXT NOT NULL,
        package_version TEXT NOT NULL,
        schema_version INTEGER NOT NULL,
        title TEXT NOT NULL,
        bundle_path TEXT NOT NULL,
        installed_at TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
}

/**
 * In-memory adapter untuk pengujian otomatis (Vitest/Node) dan fallback non-native.
 */
export class InMemoryDatabaseAdapter implements DatabaseAdapter {
  private settings = new Map<string, string>();
  private packages = new Map<string, Record<string, unknown>>();
  private packageContents = new Map<string, Record<string, unknown>>();
  private wordViews = new Map<string, Record<string, unknown>>(); // key: `${package_id}:${word_id}`
  private streaks = new Map<string, Record<string, unknown>>(); // key: `${package_id}:${date_string}`
  private unitProgress = new Map<string, Record<string, unknown>>(); // key: `${package_id}:${unit_id}:${session_id}`
  private challengeProgress = new Map<string, Record<string, unknown>>(); // key: `${package_id}:${challenge_id}`
  private mockTableInfo: { name: string }[] | null = null;

  setMockTableInfo(columns: { name: string }[] | null): void {
    this.mockTableInfo = columns;
  }

  async exec(sql: string): Promise<void> {
    const clean = sql.trim().toUpperCase();
    if (clean.includes('ALTER TABLE INSTALLED_PACKAGES ADD COLUMN TITLE')) {
      if (this.mockTableInfo) {
        this.mockTableInfo.push({ name: 'title' });
      }
    }
    if (clean.includes('DROP TABLE INSTALLED_PACKAGES') || clean.includes('DROP TABLE IF EXISTS INSTALLED_PACKAGES')) {
      this.mockTableInfo = null;
    }
    if (clean.includes('DROP TABLE') && !clean.includes('INSTALLED_PACKAGES_V2') && !clean.includes('INSTALLED_PACKAGES')) {
      this.settings.clear();
      this.packages.clear();
      this.packageContents.clear();
      this.wordViews.clear();
      this.streaks.clear();
      this.unitProgress.clear();
      this.challengeProgress.clear();
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number; lastInsertRowId?: number }> {
    const cleanSql = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (cleanSql.startsWith('INSERT INTO APP_SETTINGS') || cleanSql.startsWith('INSERT OR REPLACE INTO APP_SETTINGS')) {
      const [key, value] = params as [string, string];
      this.settings.set(key, String(value));
      return { changes: 1 };
    }

    if (
      cleanSql.startsWith('INSERT INTO PACKAGE_CONTENTS') ||
      cleanSql.startsWith('INSERT OR REPLACE INTO PACKAGE_CONTENTS')
    ) {
      const [package_id, content_json, archive_bytes, updated_at] = params as [
        string,
        string,
        unknown,
        string,
      ];
      this.packageContents.set(package_id, {
        package_id,
        content_json,
        archive_bytes,
        updated_at,
      });
      return { changes: 1 };
    }

    if (
      cleanSql.startsWith('INSERT INTO WORD_VIEWS') ||
      cleanSql.startsWith('INSERT OR REPLACE INTO WORD_VIEWS')
    ) {
      const [package_id, word_id, view_count, first_viewed_at, last_viewed_at] = params as [
        string,
        string,
        number,
        string,
        string,
      ];
      const key = `${package_id}:${word_id}`;
      this.wordViews.set(key, {
        package_id,
        word_id,
        view_count,
        first_viewed_at,
        last_viewed_at,
      });
      return { changes: 1 };
    }

    if (
      cleanSql.startsWith('INSERT INTO DAILY_STREAKS') ||
      cleanSql.startsWith('INSERT OR REPLACE INTO DAILY_STREAKS')
    ) {
      const [package_id, date_string, scroll_count, is_completed, completed_at] = params as [
        string,
        string,
        number,
        number,
        string | null,
      ];
      const key = `${package_id}:${date_string}`;
      this.streaks.set(key, {
        package_id,
        date_string,
        scroll_count,
        is_completed,
        completed_at,
      });
      return { changes: 1 };
    }

    if (
      cleanSql.startsWith('INSERT INTO UNIT_SESSION_PROGRESS') ||
      cleanSql.startsWith('INSERT OR REPLACE INTO UNIT_SESSION_PROGRESS')
    ) {
      const [package_id, unit_id, session_id, is_completed, score_percentage, completed_at] = params as [
        string,
        string,
        string,
        number,
        number,
        string | null,
      ];
      const key = `${package_id}:${unit_id}:${session_id}`;
      this.unitProgress.set(key, {
        package_id,
        unit_id,
        session_id,
        is_completed,
        score_percentage: score_percentage ?? 0,
        completed_at,
      });
      return { changes: 1 };
    }

    if (
      cleanSql.startsWith('INSERT INTO CHALLENGE_PROGRESS') ||
      cleanSql.startsWith('INSERT OR REPLACE INTO CHALLENGE_PROGRESS')
    ) {
      const [package_id, challenge_id, is_completed, completed_variant, completed_at] = params as [
        string,
        string,
        number,
        string,
        string | null,
      ];
      const key = `${package_id}:${challenge_id}`;
      this.challengeProgress.set(key, {
        package_id,
        challenge_id,
        is_completed,
        completed_variant: completed_variant || 'solo',
        completed_at,
      });
      return { changes: 1 };
    }

    if (
      cleanSql.startsWith('DELETE FROM CHALLENGE_PROGRESS') &&
      cleanSql.includes('PACKAGE_ID = ?') &&
      cleanSql.includes('CHALLENGE_ID = ?')
    ) {
      const [package_id, challenge_id] = params as [string, string];
      const key = `${package_id}:${challenge_id}`;
      const deleted = this.challengeProgress.delete(key);
      return { changes: deleted ? 1 : 0 };
    }

    if (
      cleanSql.startsWith('DELETE FROM CHALLENGE_PROGRESS') &&
      cleanSql.includes('PACKAGE_ID = ?')
    ) {
      const [package_id] = params as [string];
      let deleted = 0;
      for (const [k, v] of this.challengeProgress.entries()) {
        if (v.package_id === package_id) {
          this.challengeProgress.delete(k);
          deleted++;
        }
      }
      return { changes: deleted };
    }

    if (
      cleanSql.startsWith('INSERT INTO INSTALLED_PACKAGES') ||
      cleanSql.startsWith('INSERT OR REPLACE INTO INSTALLED_PACKAGES') ||
      cleanSql.startsWith('INSERT INTO INSTALLED_PACKAGES_V2') ||
      cleanSql.startsWith('INSERT OR REPLACE INTO INSTALLED_PACKAGES_V2')
    ) {
      const [
        package_id,
        language_id,
        dialect_id,
        package_version,
        schema_version,
        title,
        bundle_path,
        installed_at,
        is_active,
      ] = params as [string, string, string, string, number, string, string, string, number];

      this.packages.set(package_id, {
        package_id,
        language_id,
        dialect_id,
        package_version,
        schema_version,
        title: title || package_id,
        bundle_path: bundle_path || '',
        installed_at,
        is_active: is_active ?? 0,
      });
      return { changes: 1 };
    }

    if (cleanSql.startsWith('UPDATE INSTALLED_PACKAGES SET IS_ACTIVE = 0')) {
      let count = 0;
      for (const [id, pkg] of this.packages.entries()) {
        this.packages.set(id, { ...pkg, is_active: 0 });
        count++;
      }
      return { changes: count };
    }

    if (cleanSql.startsWith('UPDATE INSTALLED_PACKAGES SET IS_ACTIVE = 1')) {
      const [packageId] = params as [string];
      const existing = this.packages.get(packageId);
      if (existing) {
        this.packages.set(packageId, { ...existing, is_active: 1 });
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    if (cleanSql.startsWith('DELETE FROM APP_SETTINGS')) {
      const size = this.settings.size;
      this.settings.clear();
      return { changes: size };
    }

    if (cleanSql.startsWith('DELETE FROM INSTALLED_PACKAGES')) {
      const size = this.packages.size;
      this.packages.clear();
      return { changes: size };
    }

    if (cleanSql.startsWith('DELETE FROM PACKAGE_CONTENTS')) {
      const size = this.packageContents.size;
      this.packageContents.clear();
      return { changes: size };
    }

    if (cleanSql.startsWith('DELETE FROM WORD_VIEWS')) {
      if (cleanSql.includes('WHERE PACKAGE_ID = ?') && params.length > 0) {
        const [pkgId] = params as [string];
        let deleted = 0;
        for (const [k, v] of this.wordViews.entries()) {
          if (v.package_id === pkgId) {
            this.wordViews.delete(k);
            deleted++;
          }
        }
        return { changes: deleted };
      }
      const size = this.wordViews.size;
      this.wordViews.clear();
      return { changes: size };
    }

    if (cleanSql.startsWith('DELETE FROM DAILY_STREAKS')) {
      if (cleanSql.includes('WHERE PACKAGE_ID = ?') && params.length > 0) {
        const [pkgId] = params as [string];
        let deleted = 0;
        for (const [k, v] of this.streaks.entries()) {
          if (v.package_id === pkgId) {
            this.streaks.delete(k);
            deleted++;
          }
        }
        return { changes: deleted };
      }
      const size = this.streaks.size;
      this.streaks.clear();
      return { changes: size };
    }

    if (cleanSql.startsWith('DELETE FROM UNIT_SESSION_PROGRESS')) {
      if (cleanSql.includes('WHERE PACKAGE_ID = ?') && params.length > 0) {
        const [pkgId] = params as [string];
        let deleted = 0;
        for (const [k, v] of this.unitProgress.entries()) {
          if (v.package_id === pkgId) {
            this.unitProgress.delete(k);
            deleted++;
          }
        }
        return { changes: deleted };
      }
      const size = this.unitProgress.size;
      this.unitProgress.clear();
      return { changes: size };
    }

    return { changes: 0 };
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const cleanSql = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (cleanSql.includes('FROM APP_SETTINGS WHERE KEY = ?')) {
      const [key] = params as [string];
      const val = this.settings.get(key);
      if (val === undefined) return null;
      return { key, value: val } as unknown as T;
    }

    if (cleanSql.includes('FROM PACKAGE_CONTENTS WHERE PACKAGE_ID = ?')) {
      const [packageId] = params as [string];
      const rec = this.packageContents.get(packageId);
      return (rec ? { ...rec } : null) as unknown as T;
    }

    if (cleanSql.includes('FROM WORD_VIEWS WHERE PACKAGE_ID = ? AND WORD_ID = ?')) {
      const [package_id, word_id] = params as [string, string];
      const key = `${package_id}:${word_id}`;
      const rec = this.wordViews.get(key);
      return (rec ? { ...rec } : null) as unknown as T;
    }

    if (cleanSql.includes('FROM DAILY_STREAKS WHERE PACKAGE_ID = ? AND DATE_STRING = ?')) {
      const [package_id, date_string] = params as [string, string];
      const key = `${package_id}:${date_string}`;
      const rec = this.streaks.get(key);
      return (rec ? { ...rec } : null) as unknown as T;
    }

    if (cleanSql.includes('FROM UNIT_SESSION_PROGRESS WHERE PACKAGE_ID = ? AND UNIT_ID = ? AND SESSION_ID = ?')) {
      const [package_id, unit_id, session_id] = params as [string, string, string];
      const key = `${package_id}:${unit_id}:${session_id}`;
      const rec = this.unitProgress.get(key);
      return (rec ? { ...rec } : null) as unknown as T;
    }

    if (cleanSql.includes('FROM CHALLENGE_PROGRESS WHERE PACKAGE_ID = ? AND CHALLENGE_ID = ?')) {
      const [package_id, challenge_id] = params as [string, string];
      const key = `${package_id}:${challenge_id}`;
      const rec = this.challengeProgress.get(key);
      return (rec ? { ...rec } : null) as unknown as T;
    }

    if (cleanSql.includes('FROM INSTALLED_PACKAGES WHERE PACKAGE_ID = ?')) {
      const [packageId] = params as [string];
      const pkg = this.packages.get(packageId);
      return (pkg ? { ...pkg } : null) as unknown as T;
    }

    if (cleanSql.includes('FROM INSTALLED_PACKAGES WHERE IS_ACTIVE = 1')) {
      for (const pkg of this.packages.values()) {
        if (pkg.is_active === 1) return { ...pkg } as unknown as T;
      }
      return null;
    }

    return null;
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const cleanSql = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (cleanSql.includes('PRAGMA TABLE_INFO(INSTALLED_PACKAGES)')) {
      if (this.mockTableInfo !== null) {
        return this.mockTableInfo as unknown as T[];
      }
      return [
        { name: 'package_id' },
        { name: 'language_id' },
        { name: 'dialect_id' },
        { name: 'package_version' },
        { name: 'schema_version' },
        { name: 'title' },
        { name: 'bundle_path' },
        { name: 'installed_at' },
        { name: 'is_active' },
      ] as unknown as T[];
    }

    if (cleanSql.includes('FROM WORD_VIEWS WHERE PACKAGE_ID = ?')) {
      const [package_id] = params as [string];
      return Array.from(this.wordViews.values())
        .filter((w) => w.package_id === package_id)
        .map((w) => ({ ...w })) as unknown as T[];
    }

    if (cleanSql.includes('FROM INSTALLED_PACKAGES')) {
      return Array.from(this.packages.values()).map((p) => ({ ...p })) as unknown as T[];
    }

    if (cleanSql.includes('FROM APP_SETTINGS')) {
      return Array.from(this.settings.entries()).map(([key, value]) => ({ key, value })) as unknown as T[];
    }

    if (cleanSql.includes('FROM UNIT_SESSION_PROGRESS WHERE PACKAGE_ID = ? AND UNIT_ID = ?')) {
      const [package_id, unit_id] = params as [string, string];
      return Array.from(this.unitProgress.values())
        .filter((u) => u.package_id === package_id && u.unit_id === unit_id)
        .map((u) => ({ ...u })) as unknown as T[];
    }

    if (cleanSql.includes('FROM UNIT_SESSION_PROGRESS WHERE PACKAGE_ID = ?')) {
      const [package_id] = params as [string];
      return Array.from(this.unitProgress.values())
        .filter((u) => u.package_id === package_id)
        .map((u) => ({ ...u })) as unknown as T[];
    }

    if (cleanSql.includes('FROM CHALLENGE_PROGRESS WHERE PACKAGE_ID = ?')) {
      const [package_id] = params as [string];
      return Array.from(this.challengeProgress.values())
        .filter((c) => c.package_id === package_id)
        .map((c) => ({ ...c })) as unknown as T[];
    }

    if (cleanSql.includes('FROM DAILY_STREAKS WHERE PACKAGE_ID = ?')) {
      const [package_id] = params as [string];
      const onlyCompleted = cleanSql.includes('IS_COMPLETED = 1');
      return Array.from(this.streaks.values())
        .filter((s) => s.package_id === package_id && (!onlyCompleted || s.is_completed === 1))
        .map((s) => ({ ...s })) as unknown as T[];
    }

    return [];
  }

  async close(): Promise<void> {
    this.settings.clear();
    this.packages.clear();
    this.wordViews.clear();
    this.streaks.clear();
    this.unitProgress.clear();
    this.challengeProgress.clear();
    this.mockTableInfo = null;
  }
}

/**
 * Adapter SQLite menggunakan expo-sqlite API
 */
class ExpoSqliteDatabaseAdapter implements DatabaseAdapter {
  private db: unknown;

  constructor(db: unknown) {
    this.db = db;
  }

  async exec(sql: string): Promise<void> {
    const db = this.db as { execAsync: (query: string) => Promise<void> };
    await db.execAsync(sql);
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number; lastInsertRowId?: number }> {
    const db = this.db as {
      runAsync: (query: string, ...args: unknown[]) => Promise<{ changes: number; lastInsertRowId?: number }>;
    };
    return await db.runAsync(sql, ...(params ?? []));
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const db = this.db as {
      getFirstAsync: <R>(query: string, ...args: unknown[]) => Promise<R | null>;
    };
    return await db.getFirstAsync<T>(sql, ...(params ?? []));
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = this.db as {
      getAllAsync: <R>(query: string, ...args: unknown[]) => Promise<R[]>;
    };
    return await db.getAllAsync<T>(sql, ...(params ?? []));
  }

  async close(): Promise<void> {
    const db = this.db as { closeAsync?: () => Promise<void> };
    if (db.closeAsync) await db.closeAsync();
  }
}

let activeAdapter: DatabaseAdapter | null = null;
let isSchemaReady = false;

export async function getAppDatabase(customAdapter?: DatabaseAdapter): Promise<DatabaseAdapter> {
  if (customAdapter) {
    activeAdapter = customAdapter;
    await initializeDatabaseSchema(activeAdapter);
    isSchemaReady = true;
    return activeAdapter;
  }

  if (activeAdapter && isSchemaReady) return activeAdapter;

  if (!activeAdapter) {
    try {
      const SQLite = await import('expo-sqlite');
      if (SQLite && typeof SQLite.openDatabaseAsync === 'function') {
        const nativeDb = await SQLite.openDatabaseAsync('clata.db');
        activeAdapter = new ExpoSqliteDatabaseAdapter(nativeDb);
      } else {
        activeAdapter = new InMemoryDatabaseAdapter();
      }
    } catch {
      // Fallback ke in-memory saat diuji di lingkungan Node.js / Vitest
      activeAdapter = new InMemoryDatabaseAdapter();
    }
  }

  await initializeDatabaseSchema(activeAdapter);
  isSchemaReady = true;
  return activeAdapter;
}

export function resetDatabaseInstance(): void {
  activeAdapter = null;
  isSchemaReady = false;
}
