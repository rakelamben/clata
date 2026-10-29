import type { Clock } from '../../../domain/ports/Clock';
import { getAgeCategory, validateBirthYear } from '../../../domain/onboarding/ageGate';
import type { LocalProfile } from '../../../domain/onboarding/onboardingTypes';
import type { SettingsRepository } from '../../settings/data/settingsRepository';
import type { DatabasePort } from '../../../infrastructure/database/DatabasePort';

export const PROFILE_KEYS = {
  birthYear: 'birth_year',
  selectedPackageId: 'selected_package_id',
  ageGateStatus: 'age_gate_status',
  introDismissed: 'intro_dismissed',
  localWarningAcknowledged: 'local_data_warning_acknowledged',
} as const;

export class LocalProfileRepository {
  constructor(private readonly getDatabase: () => Promise<DatabasePort>, private readonly clock: Clock) {}

  private get settings(): SettingsRepository {
    const getDatabase = this.getDatabase;
    return {
      get: async <T>(key: string) => {
        const row = await (await getDatabase()).get<{ value_json: string }>('SELECT value_json FROM settings WHERE key = ?', [key]);
        if (!row) return null;
        try { return JSON.parse(row.value_json) as T; } catch { return null; }
      },
      set: async <T>(key: string, value: T) => {
        await (await getDatabase()).run('INSERT OR REPLACE INTO settings(key, value_json, updated_at, local_only) VALUES (?, ?, ?, 1)', [key, JSON.stringify(value), this.clock.now().toISOString()]);
      },
    };
  }

  async getProfile(): Promise<LocalProfile> {
    const birthYear = await this.settings.get<number>(PROFILE_KEYS.birthYear);
    const selectedPackageId = await this.settings.get<string>(PROFILE_KEYS.selectedPackageId);
    return {
      birthYear,
      ageCategory: birthYear === null ? null : getAgeCategory(birthYear, this.clock),
      selectedPackageId,
    };
  }

  async saveBirthYear(birthYear: number): Promise<void> {
    await this.settings.set(PROFILE_KEYS.birthYear, birthYear);
    await this.settings.set(PROFILE_KEYS.ageGateStatus, getAgeCategory(birthYear, this.clock));
  }

  async setSelectedPackage(packageId: string): Promise<void> {
    await this.settings.set(PROFILE_KEYS.selectedPackageId, packageId);
  }

  async setIntroDismissed(): Promise<void> {
    await this.settings.set(PROFILE_KEYS.introDismissed, true);
  }

  async isIntroDismissed(): Promise<boolean> {
    return (await this.settings.get<boolean>(PROFILE_KEYS.introDismissed)) === true;
  }

  async acknowledgeLocalWarning(): Promise<void> {
    await this.settings.set(PROFILE_KEYS.localWarningAcknowledged, true);
  }

  async isLocalWarningAcknowledged(): Promise<boolean> {
    return (await this.settings.get<boolean>(PROFILE_KEYS.localWarningAcknowledged)) === true;
  }

  async completeOnboarding(birthYear: number, packageId: string): Promise<void> {
    const invalid = validateBirthYear(birthYear, this.clock.now());
    if (invalid) throw new Error(invalid);
    const category = getAgeCategory(birthYear, this.clock);
    if (category === 'blocked') throw new Error('Usia minimal untuk menggunakan Clata adalah 10 tahun.');
    await (await this.getDatabase()).transaction(async (transaction) => {
      const active = await transaction.get('SELECT package_id FROM installed_packages WHERE package_id = ? AND install_state = ?', [packageId, 'active']);
      if (!active) throw new Error('Paket bahasa belum siap digunakan.');
      const timestamp = this.clock.now().toISOString();
      const writes: [string, unknown][] = [
        [PROFILE_KEYS.birthYear, birthYear],
        [PROFILE_KEYS.ageGateStatus, category],
        [PROFILE_KEYS.selectedPackageId, packageId],
        [PROFILE_KEYS.introDismissed, true],
        [PROFILE_KEYS.localWarningAcknowledged, true],
      ];
      for (const [key, value] of writes) await transaction.run('INSERT OR REPLACE INTO settings(key, value_json, updated_at, local_only) VALUES (?, ?, ?, 1)', [key, JSON.stringify(value), timestamp]);
      await transaction.run('INSERT OR REPLACE INTO app_metadata(key, value_json, updated_at) VALUES (?, ?, ?)', ['onboarding_completed', JSON.stringify(true), timestamp]);
    });
  }
}
