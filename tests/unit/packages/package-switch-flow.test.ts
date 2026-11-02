import { describe, expect, it, beforeEach } from 'vitest';

import { InMemoryDatabaseAdapter } from '../../../src/infrastructure/database/appDatabase';
import { PackageRepository } from '../../../src/infrastructure/database/packageRepository';
import { SettingsRepository } from '../../../src/infrastructure/database/settingsRepository';
import { UnitProgressRepository } from '../../../src/infrastructure/database/unitProgressRepository';
import { StreakRepository } from '../../../src/infrastructure/database/streakRepository';
import type { InstalledPackageDbRecord } from '../../../src/infrastructure/database/databaseTypes';
import type { LoadedPackage } from '../../../src/domain/package/packageTypes';

describe('Audit: Fitur Beralih Paket Bahasa & Isolasi Data', () => {
  let db: InMemoryDatabaseAdapter;
  let packageRepo: PackageRepository;
  let settingsRepo: SettingsRepository;
  let unitRepo: UnitProgressRepository;
  let streakRepo: StreakRepository;

  const packageA: InstalledPackageDbRecord = {
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

  const packageB: InstalledPackageDbRecord = {
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

  const dummyContentA: LoadedPackage = {
    manifest: {
      packageId: 'jawa-mataraman',
      languageId: 'jv',
      dialectId: 'mataraman',
      packageVersion: '2.0.0',
      schemaVersion: 2,
      minimumAppVersion: '1.0.0',
      registerMapping: { akrab: 'ngoko', sopan: 'krama', netral: 'netral' },
      orthographyReference: 'standard',
      createdAt: '2026-11-01T10:00:00Z',
      itemCounts: { units: 1, words: 10, sentences: 5, dialogues: 1, challenges: 2 },
      files: [],
    },
    units: [{ unit_id: 'unit-1', order: 1, title: 'Sapaan' }],
    words: [
      {
        id: 'w1',
        unit_id: 'unit-1',
        text: 'Sugeng',
        meaning: 'Selamat',
        part_of_speech: 'adverb',
        register: 'netral',
        theme: 'sapaan',
        audio: 'audio/sample.opus',
        status: 'poc',
      },
    ],
    sentences: [],
    dialogues: [],
    challenges: [],
  };

  const dummyContentB: LoadedPackage = {
    manifest: {
      packageId: 'sunda-priangan',
      languageId: 'su',
      dialectId: 'priangan',
      packageVersion: '1.0.0',
      schemaVersion: 2,
      minimumAppVersion: '1.0.0',
      registerMapping: { akrab: 'loma', sopan: 'lemes', netral: 'netral' },
      orthographyReference: 'standard',
      createdAt: '2026-11-01T11:00:00Z',
      itemCounts: { units: 1, words: 10, sentences: 5, dialogues: 1, challenges: 2 },
      files: [],
    },
    units: [{ unit_id: 'unit-1', order: 1, title: 'Pangbagea' }],
    words: [
      {
        id: 'w101',
        unit_id: 'unit-1',
        text: 'Wilujeng',
        meaning: 'Selamat',
        part_of_speech: 'adverb',
        register: 'netral',
        theme: 'sapaan',
        audio: 'audio/sample.opus',
        status: 'poc',
      },
    ],
    sentences: [],
    dialogues: [],
    challenges: [],
  };

  beforeEach(async () => {
    db = new InMemoryDatabaseAdapter();
    packageRepo = new PackageRepository(db);
    settingsRepo = new SettingsRepository(db);
    unitRepo = new UnitProgressRepository(db);
    streakRepo = new StreakRepository(db);

    // Pasang paket A dan B
    await packageRepo.savePackage(packageA);
    await packageRepo.savePackageContent(packageA.package_id, dummyContentA);

    await packageRepo.savePackage(packageB);
    await packageRepo.savePackageContent(packageB.package_id, dummyContentB);

    await packageRepo.setActivePackage('jawa-mataraman');
    await settingsRepo.setActivePackageId('jawa-mataraman');
  });

  it('beralih antar paket terpasang secara atomik dan memperbarui is_active serta settings', async () => {
    // Awal: Paket A aktif
    let activePkg = await packageRepo.getActivePackage();
    let activeSetting = await settingsRepo.getActivePackageId();
    expect(activePkg?.package_id).toBe('jawa-mataraman');
    expect(activeSetting).toBe('jawa-mataraman');

    // Beralih ke Paket B
    await packageRepo.setActivePackage('sunda-priangan');
    await settingsRepo.setActivePackageId('sunda-priangan');

    activePkg = await packageRepo.getActivePackage();
    activeSetting = await settingsRepo.getActivePackageId();
    expect(activePkg?.package_id).toBe('sunda-priangan');
    expect(activeSetting).toBe('sunda-priangan');

    // Periksa bahwa paket A kini is_active = 0
    const oldPkg = await packageRepo.getPackage('jawa-mataraman');
    expect(oldPkg?.is_active).toBe(0);

    // Ambil konten paket B
    const content = await packageRepo.getPackageContent('sunda-priangan');
    expect(content?.manifest.packageId).toBe('sunda-priangan');
    expect(content?.words[0]?.text).toBe('Wilujeng');
  });

  it('mengimpor paket dengan ID yang sama memperbarui data tanpa menduplikasi entri di database', async () => {
    const allBefore = await packageRepo.getAllPackages();
    expect(allBefore.length).toBe(2);

    // Update versi paket A menjadi 2.1.0
    const updatedPackageA: InstalledPackageDbRecord = {
      ...packageA,
      package_version: '2.1.0',
      title: 'Jawa Mataraman Edisi Revisi',
      installed_at: '2026-11-02T09:00:00Z',
    };
    await packageRepo.savePackage(updatedPackageA);

    const allAfter = await packageRepo.getAllPackages();
    // Tidak bertambah menjadi 3 baris!
    expect(allAfter.length).toBe(2);

    const fetchedA = await packageRepo.getPackage('jawa-mataraman');
    expect(fetchedA?.package_version).toBe('2.1.0');
    expect(fetchedA?.title).toBe('Jawa Mataraman Edisi Revisi');
  });

  it('memastikan progres latihan dan streak terisolasi antar paket', async () => {
    // Selesaikan sesi di Paket A
    await unitRepo.recordSessionCompletion('jawa-mataraman', 'unit-1', 'unit-1-w1', 100);
    // Selesaikan streak di Paket A
    for (let i = 0; i < 10; i++) {
      await streakRepo.incrementDailyScroll('jawa-mataraman', '2026-11-02');
    }

    // Periksa progres di Paket A
    const unitProgressA = await unitRepo.getAllUnitProgress('jawa-mataraman');
    expect(unitProgressA['unit-1:unit-1-w1']?.is_completed).toBe(1);
    const streakA = await streakRepo.getConsecutiveStreak('jawa-mataraman', '2026-11-02');
    expect(streakA).toBe(1);

    // Periksa progres di Paket B (harus 0 dan tidak terpengaruh!)
    const unitProgressB = await unitRepo.getAllUnitProgress('sunda-priangan');
    expect(unitProgressB['unit-1:unit-1-w1']).toBeUndefined();
    const streakB = await streakRepo.getConsecutiveStreak('sunda-priangan', '2026-11-02');
    expect(streakB).toBe(0);
  });

  it('mempertahankan progres pengguna ketika paket diimpor ulang dengan ID yang sama', async () => {
    // Rekam penyelesaian sesi di Paket A
    await unitRepo.recordSessionCompletion('jawa-mataraman', 'unit-1', 'unit-1-w1', 95);

    // Impor ulang berkas konten Paket A (misal perbaikan typo)
    await packageRepo.savePackageContent(packageA.package_id, {
      ...dummyContentA,
      manifest: {
        ...dummyContentA.manifest,
        packageVersion: '2.0.1',
      },
    });

    // Periksa kembali: riwayat sesi belajar pengguna tetap utuh!
    const progressAfterReimport = await unitRepo.getUnitSessionProgress(
      'jawa-mataraman',
      'unit-1',
      'unit-1-w1',
    );
    expect(progressAfterReimport).not.toBeNull();
    expect(progressAfterReimport?.is_completed).toBe(1);
    expect(progressAfterReimport?.score_percentage).toBe(95);
  });
});
