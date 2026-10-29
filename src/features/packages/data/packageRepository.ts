import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';
import type { LanguageDialectOption } from '../../../domain/onboarding/onboardingTypes';

export class PackageRepository {
  constructor(private readonly getDatabase: () => Promise<DatabasePort>) {}

  async listActive(): Promise<LanguageDialectOption[]> {
    const rows = await (await this.getDatabase()).all<Record<string, unknown>>('SELECT package_id, language_id, dialect_id, package_version FROM installed_packages WHERE install_state = ? ORDER BY language_id, dialect_id', ['active']);
    return rows.map((row) => ({ packageId: String(row.package_id), languageId: String(row.language_id), dialectId: String(row.dialect_id), packageVersion: String(row.package_version) }));
  }

  async isActive(packageId: string): Promise<boolean> {
    const row = await (await this.getDatabase()).get('SELECT package_id FROM installed_packages WHERE package_id = ? AND install_state = ?', [packageId, 'active']);
    return Boolean(row);
  }

  async listFirstUnitWords(packageId: string): Promise<{ id: string; lemma: string; meaning: string }[]> {
    const rows = await (await this.getDatabase()).all<Record<string, unknown>>('SELECT payload_json FROM words WHERE package_id = ? AND unit_id = (SELECT item_id FROM units WHERE package_id = ? ORDER BY unit_order ASC LIMIT 1) ORDER BY item_order ASC', [packageId, packageId]);
    return rows.map((row) => {
      const payload = JSON.parse(String(row.payload_json)) as Record<string, unknown>;
      return { id: String(payload.id ?? ''), lemma: String(payload.lemma ?? payload.word ?? payload.text ?? ''), meaning: String(payload.meaning ?? '') };
    });
  }
}
