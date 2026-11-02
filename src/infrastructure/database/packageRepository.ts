import type { LoadedPackage } from '../../domain/package/packageTypes';
import { getAppDatabase } from './appDatabase';
import type { DatabaseAdapter, InstalledPackageDbRecord } from './databaseTypes';

export class PackageRepository {
  private dbProvider: () => Promise<DatabaseAdapter>;

  constructor(customDb?: DatabaseAdapter) {
    this.dbProvider = customDb ? async () => customDb : getAppDatabase;
  }

  async getAllPackages(): Promise<InstalledPackageDbRecord[]> {
    const db = await this.dbProvider();
    return await db.all<InstalledPackageDbRecord>('SELECT * FROM installed_packages ORDER BY installed_at DESC');
  }

  async getPackage(packageId: string): Promise<InstalledPackageDbRecord | null> {
    const db = await this.dbProvider();
    return await db.get<InstalledPackageDbRecord>(
      'SELECT * FROM installed_packages WHERE package_id = ?',
      [packageId],
    );
  }

  async getActivePackage(): Promise<InstalledPackageDbRecord | null> {
    const db = await this.dbProvider();
    return await db.get<InstalledPackageDbRecord>(
      'SELECT * FROM installed_packages WHERE is_active = 1',
    );
  }

  async savePackage(pkg: InstalledPackageDbRecord): Promise<void> {
    const db = await this.dbProvider();
    await db.run(
      `INSERT OR REPLACE INTO installed_packages (
        package_id, language_id, dialect_id, package_version, schema_version,
        title, bundle_path, installed_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pkg.package_id,
        pkg.language_id,
        pkg.dialect_id,
        pkg.package_version,
        pkg.schema_version,
        pkg.title,
        pkg.bundle_path,
        pkg.installed_at,
        pkg.is_active,
      ],
    );
  }

  async savePackageContent(
    packageId: string,
    loadedPackage: LoadedPackage,
    archiveBytes?: Uint8Array,
  ): Promise<void> {
    const db = await this.dbProvider();
    const contentJson = JSON.stringify(loadedPackage);
    const now = new Date().toISOString();
    await db.run(
      `INSERT OR REPLACE INTO package_contents (package_id, content_json, archive_bytes, updated_at)
       VALUES (?, ?, ?, ?)`,
      [packageId, contentJson, archiveBytes ?? null, now],
    );
  }

  async getPackageContent(packageId: string): Promise<LoadedPackage | null> {
    const db = await this.dbProvider();
    const row = await db.get<{ content_json: string }>(
      'SELECT content_json FROM package_contents WHERE package_id = ?',
      [packageId],
    );
    if (!row?.content_json) return null;
    try {
      return JSON.parse(row.content_json) as LoadedPackage;
    } catch {
      return null;
    }
  }

  async setActivePackage(packageId: string): Promise<void> {
    const db = await this.dbProvider();
    await db.run('UPDATE installed_packages SET is_active = 0');
    await db.run('UPDATE installed_packages SET is_active = 1 WHERE package_id = ?', [packageId]);
  }

  async clearAllPackages(): Promise<void> {
    const db = await this.dbProvider();
    await db.run('DELETE FROM installed_packages');
    await db.run('DELETE FROM package_contents');
  }
}
