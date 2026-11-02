import { describe, expect, it, beforeEach } from 'vitest';

import { InMemoryDatabaseAdapter } from '../../../src/infrastructure/database/appDatabase';
import { PackageRepository } from '../../../src/infrastructure/database/packageRepository';
import { SettingsRepository } from '../../../src/infrastructure/database/settingsRepository';
import { UnitProgressRepository } from '../../../src/infrastructure/database/unitProgressRepository';
import { StreakRepository } from '../../../src/infrastructure/database/streakRepository';
import { WordViewRepository } from '../../../src/infrastructure/database/wordViewRepository';
import { ChallengeRepository } from '../../../src/infrastructure/database/challengeRepository';
import type { InstalledPackageDbRecord } from '../../../src/infrastructure/database/databaseTypes';

describe('Audit: Fitur Reset Progres Belajar', () => {
  let db: InMemoryDatabaseAdapter;
  let packageRepo: PackageRepository;
  let settingsRepo: SettingsRepository;
  let unitRepo: UnitProgressRepository;
  let streakRepo: StreakRepository;
  let wordViewRepo: WordViewRepository;
  let challengeRepo: ChallengeRepository;

  const pkgA: InstalledPackageDbRecord = {
    package_id: 'jawa-mataraman',
    language_id: 'jv',
    dialect_id: 'mataraman',
    package_version: '2.0.0',
    schema_version: 2,
    title: 'Jawa Mataraman',
    bundle_path: 'packages/installed/jawa-mataraman/bundle.clata',
    installed_at: '2026-11-01T10:00:00Z',
    is_active: 1,
  };

  const pkgB: InstalledPackageDbRecord = {
    package_id: 'sunda-priangan',
    language_id: 'su',
    dialect_id: 'priangan',
    package_version: '1.0.0',
    schema_version: 2,
    title: 'Sunda Priangan',
    bundle_path: 'packages/installed/sunda-priangan/bundle.clata',
    installed_at: '2026-11-01T11:00:00Z',
    is_active: 0,
  };

  beforeEach(async () => {
    db = new InMemoryDatabaseAdapter();
    packageRepo = new PackageRepository(db);
    settingsRepo = new SettingsRepository(db);
    unitRepo = new UnitProgressRepository(db);
    streakRepo = new StreakRepository(db);
    wordViewRepo = new WordViewRepository(db);
    challengeRepo = new ChallengeRepository(db);

    await packageRepo.savePackage(pkgA);
    await packageRepo.savePackage(pkgB);
    await settingsRepo.setOnboardingCompleted(true);
    await settingsRepo.setAudioSpeed('slow');
  });

  it('menghapus seluruh progres belajar paket target secara menyeluruh', async () => {
    // 1. Simulasi rekaman progres untuk paket A
    await unitRepo.recordSessionCompletion('jawa-mataraman', 'unit-1', 'unit-1-w1', 100);
    await unitRepo.recordSessionCompletion('jawa-mataraman', 'unit-1', 'unit-1-s1', 90);
    await wordViewRepo.recordWordView('jawa-mataraman', 'word-1');
    await wordViewRepo.recordWordView('jawa-mataraman', 'word-2');
    await challengeRepo.toggleChallenge('jawa-mataraman', 'challenge-1', 'solo');
    for (let i = 0; i < 10; i++) {
      await streakRepo.incrementDailyScroll('jawa-mataraman', '2026-11-02');
    }

    // Verifikasi progres sebelum reset
    const unitBefore = await unitRepo.getAllUnitProgress('jawa-mataraman');
    expect(Object.keys(unitBefore).length).toBe(2);
    const wordsBefore = await wordViewRepo.getWordViewMap('jawa-mataraman');
    expect(wordsBefore.size).toBe(2);
    const streakBefore = await streakRepo.getConsecutiveStreak('jawa-mataraman', '2026-11-02');
    expect(streakBefore).toBe(1);
    const challengeBefore = await challengeRepo.getChallengeProgress('jawa-mataraman', 'challenge-1');
    expect(challengeBefore?.is_completed).toBe(1);

    // 2. Eksekusi Reset Progres Paket A
    await db.run('DELETE FROM unit_session_progress WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM daily_streaks WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM challenge_progress WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM word_views WHERE package_id = ?', ['jawa-mataraman']);

    // 3. Verifikasi seluruh progres paket A telah kembali ke 0
    const unitAfter = await unitRepo.getAllUnitProgress('jawa-mataraman');
    expect(Object.keys(unitAfter).length).toBe(0);

    const wordsAfter = await wordViewRepo.getWordViewMap('jawa-mataraman');
    expect(wordsAfter.size).toBe(0);

    const streakAfter = await streakRepo.getConsecutiveStreak('jawa-mataraman', '2026-11-02');
    expect(streakAfter).toBe(0);

    const todayStreakAfter = await streakRepo.getTodayStreak('jawa-mataraman', '2026-11-02');
    expect(todayStreakAfter.scroll_count).toBe(0);
    expect(todayStreakAfter.is_completed).toBe(0);

    const challengeAfter = await challengeRepo.getChallengeProgress('jawa-mataraman', 'challenge-1');
    expect(challengeAfter).toBeNull();
  });

  it('memastikan reset pada paket A tidak menghapus progres pada paket B (terisolasi)', async () => {
    // Rekam progres pada paket A dan B
    await unitRepo.recordSessionCompletion('jawa-mataraman', 'unit-1', 'w1', 100);
    await unitRepo.recordSessionCompletion('sunda-priangan', 'unit-1', 'w1', 100);
    await wordViewRepo.recordWordView('sunda-priangan', 'word-101');
    for (let i = 0; i < 10; i++) {
      await streakRepo.incrementDailyScroll('sunda-priangan', '2026-11-02');
    }

    // Reset hanya untuk paket A
    await db.run('DELETE FROM unit_session_progress WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM daily_streaks WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM challenge_progress WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM word_views WHERE package_id = ?', ['jawa-mataraman']);

    // Progres paket B tetap aman dan utuh
    const unitB = await unitRepo.getAllUnitProgress('sunda-priangan');
    expect(Object.keys(unitB).length).toBe(1);

    const wordsB = await wordViewRepo.getWordViewMap('sunda-priangan');
    expect(wordsB.size).toBe(1);

    const streakB = await streakRepo.getConsecutiveStreak('sunda-priangan', '2026-11-02');
    expect(streakB).toBe(1);
  });

  it('memastikan berkas paket dan pengaturan aplikasi tidak terhapus saat progres direset', async () => {
    // Reset progres paket A
    await db.run('DELETE FROM unit_session_progress WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM daily_streaks WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM challenge_progress WHERE package_id = ?', ['jawa-mataraman']);
    await db.run('DELETE FROM word_views WHERE package_id = ?', ['jawa-mataraman']);

    // Paket tetap terpasang di database
    const allPackages = await packageRepo.getAllPackages();
    expect(allPackages.length).toBe(2);
    const pkg = await packageRepo.getPackage('jawa-mataraman');
    expect(pkg).not.toBeNull();
    expect(pkg?.title).toBe('Jawa Mataraman');

    // Pengaturan global (onboarding, kecepatan audio) tidak terpengaruh
    expect(await settingsRepo.isOnboardingCompleted()).toBe(true);
    expect(await settingsRepo.getAudioSpeed()).toBe('slow');
  });
});
