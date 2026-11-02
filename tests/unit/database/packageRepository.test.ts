import { describe, expect, it, beforeEach } from 'vitest';

import { InMemoryDatabaseAdapter, initializeDatabaseSchema } from '../../../src/infrastructure/database/appDatabase';
import { PackageRepository } from '../../../src/infrastructure/database/packageRepository';
import type { InstalledPackageDbRecord } from '../../../src/infrastructure/database/databaseTypes';

describe('PackageRepository (SQLite)', () => {
  let db: InMemoryDatabaseAdapter;
  let repo: PackageRepository;

  const mockPackage1: InstalledPackageDbRecord = {
    package_id: 'jawa-mataraman',
    language_id: 'jv',
    dialect_id: 'mataraman',
    package_version: '2.0.0',
    schema_version: 2,
    title: 'Bahasa Jawa',
    bundle_path: 'packages/installed/jawa-mataraman/bundle.clata',
    installed_at: '2026-11-01T10:00:00Z',
    is_active: 1,
  };

  const mockPackage2: InstalledPackageDbRecord = {
    package_id: 'sunda-priangan',
    language_id: 'su',
    dialect_id: 'priangan',
    package_version: '1.0.0',
    schema_version: 2,
    title: 'Bahasa Sunda',
    bundle_path: 'packages/installed/sunda-priangan/bundle.clata',
    installed_at: '2026-11-01T11:00:00Z',
    is_active: 0,
  };

  beforeEach(() => {
    db = new InMemoryDatabaseAdapter();
    repo = new PackageRepository(db);
  });

  it('initially has no installed packages and no active package', async () => {
    expect(await repo.getAllPackages()).toEqual([]);
    expect(await repo.getActivePackage()).toBeNull();
  });

  it('saves and retrieves installed packages', async () => {
    await repo.savePackage(mockPackage1);
    await repo.savePackage(mockPackage2);

    const all = await repo.getAllPackages();
    expect(all.length).toBe(2);

    const pkg = await repo.getPackage('jawa-mataraman');
    expect(pkg).not.toBeNull();
    expect(pkg?.dialect_id).toBe('mataraman');

    const active = await repo.getActivePackage();
    expect(active?.package_id).toBe('jawa-mataraman');
  });

  it('switches active package atomically', async () => {
    await repo.savePackage(mockPackage1);
    await repo.savePackage(mockPackage2);

    await repo.setActivePackage('sunda-priangan');

    const active = await repo.getActivePackage();
    expect(active?.package_id).toBe('sunda-priangan');

    const old = await repo.getPackage('jawa-mataraman');
    expect(old?.is_active).toBe(0);
  });

  it('migrates legacy schema when title or modern columns are missing', async () => {
    // Simulasi tabel lama tanpa kolom title dan dengan kolom legacy (source, install_state, content_path)
    db.setMockTableInfo([
      { name: 'package_id' },
      { name: 'language_id' },
      { name: 'dialect_id' },
      { name: 'package_version' },
      { name: 'schema_version' },
      { name: 'source' },
      { name: 'install_state' },
      { name: 'content_path' },
      { name: 'installed_at' },
      { name: 'updated_at' },
    ]);

    await initializeDatabaseSchema(db);

    // Setelah migrasi, simpan paket baru dengan kolom title dan verifikasi
    await repo.savePackage(mockPackage1);
    const saved = await repo.getPackage('jawa-mataraman');
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe('Bahasa Jawa');
  });

  it('saves and retrieves loaded package content JSON persistently', async () => {
    const mockLoaded = {
      manifest: {
        packageId: 'jawa-mataraman',
        languageId: 'jv',
        dialectId: 'mataraman',
        packageVersion: '2.0.0',
        schemaVersion: 2,
        minimumAppVersion: '1.0.0',
        registerMapping: { sopan: 'krama', akrab: 'ngoko', netral: 'netral' },
        orthographyReference: 'standard',
        createdAt: '2026-11-01T10:00:00Z',
        itemCounts: { units: 1, words: 1, sentences: 0, dialogues: 0, challenges: 0 },
        files: [],
      },
      units: [{ unit_id: 'unit-1', order: 1, title: 'Unit 1' }],
      words: [
        {
          id: 'kata-1',
          text: 'mangan',
          meaning: 'makan',
          part_of_speech: 'verb',
          register: 'akrab' as const,
          theme: 'daily',
          unit_id: 'unit-1',
          audio: 'audio/mangan.opus',
          status: 'poc',
        },
      ],
      sentences: [],
      dialogues: [],
      challenges: [],
    };

    await repo.savePackageContent('jawa-mataraman', mockLoaded);
    const retrieved = await repo.getPackageContent('jawa-mataraman');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.manifest.packageId).toBe('jawa-mataraman');
    expect(retrieved?.words.length).toBe(1);
    expect(retrieved?.words[0]?.text).toBe('mangan');
  });
});
