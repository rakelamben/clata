import { describe, expect, it, beforeEach } from 'vitest';

import { InMemoryDatabaseAdapter } from '../../../src/infrastructure/database/appDatabase';
import { SettingsRepository } from '../../../src/infrastructure/database/settingsRepository';

describe('SettingsRepository (SQLite)', () => {
  let db: InMemoryDatabaseAdapter;
  let repo: SettingsRepository;

  beforeEach(() => {
    db = new InMemoryDatabaseAdapter();
    repo = new SettingsRepository(db);
  });

  it('defaults to false for onboarding status and null for active package', async () => {
    expect(await repo.isOnboardingCompleted()).toBe(false);
    expect(await repo.getActivePackageId()).toBeNull();
    expect(await repo.getSystemLanguage()).toBe('id');
  });

  it('updates and persists onboarding completed status', async () => {
    await repo.setOnboardingCompleted(true);
    expect(await repo.isOnboardingCompleted()).toBe(true);

    await repo.setOnboardingCompleted(false);
    expect(await repo.isOnboardingCompleted()).toBe(false);
  });

  it('sets, retrieves, and clears active package id', async () => {
    await repo.setActivePackageId('jawa-mataraman');
    expect(await repo.getActivePackageId()).toBe('jawa-mataraman');

    await repo.setActivePackageId(null);
    expect(await repo.getActivePackageId()).toBeNull();
  });

  it('sets and retrieves audio speed setting', async () => {
    expect(await repo.getAudioSpeed()).toBe('normal');
    await repo.setAudioSpeed('slow');
    expect(await repo.getAudioSpeed()).toBe('slow');
    await repo.setAudioSpeed('normal');
    expect(await repo.getAudioSpeed()).toBe('normal');
  });

  it('clears all settings cleanly', async () => {
    await repo.setOnboardingCompleted(true);
    await repo.setActivePackageId('jawa-mataraman');

    await repo.clearAllSettings();
    expect(await repo.isOnboardingCompleted()).toBe(false);
    expect(await repo.getActivePackageId()).toBeNull();
  });
});
