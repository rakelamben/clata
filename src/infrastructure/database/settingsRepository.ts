import { setCachedPlaybackRate } from '../../features/vocabulary/audio/audioPlayback';
import { getAppDatabase } from './appDatabase';
import type { DatabaseAdapter } from './databaseTypes';

const ONBOARDING_KEY = 'onboarding_completed';
const ACTIVE_PACKAGE_KEY = 'active_package_id';
const SYSTEM_LANGUAGE_KEY = 'system_language';
const AUDIO_SPEED_KEY = 'audio_speed';

export class SettingsRepository {
  private dbProvider: () => Promise<DatabaseAdapter>;

  constructor(customDb?: DatabaseAdapter) {
    this.dbProvider = customDb ? async () => customDb : getAppDatabase;
  }

  async isOnboardingCompleted(): Promise<boolean> {
    const db = await this.dbProvider();
    const row = await db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [
      ONBOARDING_KEY,
    ]);
    return row?.value === 'true';
  }

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    const db = await this.dbProvider();
    await db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [
      ONBOARDING_KEY,
      completed ? 'true' : 'false',
    ]);
  }

  async getActivePackageId(): Promise<string | null> {
    const db = await this.dbProvider();
    const row = await db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [
      ACTIVE_PACKAGE_KEY,
    ]);
    return row?.value ?? null;
  }

  async setActivePackageId(packageId: string | null): Promise<void> {
    const db = await this.dbProvider();
    if (!packageId) {
      await db.run('DELETE FROM app_settings WHERE key = ?', [ACTIVE_PACKAGE_KEY]);
    } else {
      await db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [
        ACTIVE_PACKAGE_KEY,
        packageId,
      ]);
    }
  }

  async getSystemLanguage(): Promise<string> {
    const db = await this.dbProvider();
    const row = await db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [
      SYSTEM_LANGUAGE_KEY,
    ]);
    return row?.value ?? 'id';
  }

  async getAudioSpeed(): Promise<'normal' | 'slow'> {
    const db = await this.dbProvider();
    const row = await db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [
      AUDIO_SPEED_KEY,
    ]);
    return row?.value === 'slow' ? 'slow' : 'normal';
  }

  async setAudioSpeed(speed: 'normal' | 'slow'): Promise<void> {
    const db = await this.dbProvider();
    await db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [
      AUDIO_SPEED_KEY,
      speed,
    ]);
    setCachedPlaybackRate(speed === 'slow' ? 0.8 : 1.0);
  }

  async clearAllSettings(): Promise<void> {
    const db = await this.dbProvider();
    await db.run('DELETE FROM app_settings');
  }
}
