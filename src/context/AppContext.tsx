import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  installPackageFromBuffer,
  type InstallProgressCallback,
} from '../domain/package/atomicPackageInstaller';
import type {
  LoadedPackage,
  PackageInstallResult,
} from '../domain/package/packageTypes';
import type { InstalledPackageDbRecord } from '../infrastructure/database/databaseTypes';
import { getAppDatabase } from '../infrastructure/database/appDatabase';
import { PackageRepository } from '../infrastructure/database/packageRepository';
import { SettingsRepository } from '../infrastructure/database/settingsRepository';

export interface StagedPackageArchive {
  buffer: Uint8Array;
  fileName: string;
  sizeBytes: number;
}

export interface AppContextValue {
  isInitialized: boolean;
  isOnboardingCompleted: boolean;
  activePackageId: string | null;
  activePackageData: LoadedPackage | null;
  installedPackages: InstalledPackageDbRecord[];
  stagedArchive: StagedPackageArchive | null;
  setStagedArchive: (archive: StagedPackageArchive | null) => void;
  installStagedPackage: (
    archiveOrProgress?: StagedPackageArchive | Uint8Array | InstallProgressCallback,
    onProgress?: InstallProgressCallback,
  ) => Promise<PackageInstallResult>;
  completeOnboarding: () => Promise<void>;
  resetAppState: () => Promise<void>;
  resetPackageProgress: (packageId: string) => Promise<void>;
  switchActivePackage: (packageId: string) => Promise<void>;
  refreshInstalledPackages: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const settingsRepo = new SettingsRepository();
const packageRepo = new PackageRepository();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [activePackageData, setActivePackageData] = useState<LoadedPackage | null>(null);
  const [installedPackages, setInstalledPackages] = useState<InstalledPackageDbRecord[]>([]);
  const [stagedArchive, setStagedArchive] = useState<StagedPackageArchive | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initDb = async () => {
      try {
        const completed = await settingsRepo.isOnboardingCompleted();
        const activeId = await settingsRepo.getActivePackageId();
        const packages = await packageRepo.getAllPackages();

        let loadedContent: LoadedPackage | null = null;
        if (activeId) {
          loadedContent = await packageRepo.getPackageContent(activeId);
        }

        if (isMounted) {
          setIsOnboardingCompleted(completed);
          setActivePackageId(activeId);
          setActivePackageData(loadedContent);
          setInstalledPackages(packages);
        }
      } catch (err) {
        console.warn('Gagal memuat status database Clata:', err);
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    void initDb();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const completed = await settingsRepo.isOnboardingCompleted();
      const activeId = await settingsRepo.getActivePackageId();
      const packages = await packageRepo.getAllPackages();

      let loadedContent: LoadedPackage | null = null;
      if (activeId) {
        loadedContent = await packageRepo.getPackageContent(activeId);
      }

      setIsOnboardingCompleted(completed);
      setActivePackageId(activeId);
      setActivePackageData(loadedContent);
      setInstalledPackages(packages);
    } catch (err) {
      console.warn('Gagal memuat status database Clata:', err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const installStagedPackage = useCallback(
    async (
      archiveOrProgress?: StagedPackageArchive | Uint8Array | InstallProgressCallback,
      maybeProgress?: InstallProgressCallback,
    ): Promise<PackageInstallResult> => {
      let targetArchive: StagedPackageArchive | null = null;
      let onProgress: InstallProgressCallback | undefined;

      if (typeof archiveOrProgress === 'function') {
        onProgress = archiveOrProgress;
        targetArchive = stagedArchive;
      } else if (archiveOrProgress instanceof Uint8Array) {
        targetArchive = {
          buffer: archiveOrProgress,
          fileName: 'package.clata',
          sizeBytes: archiveOrProgress.byteLength,
        };
        onProgress = maybeProgress;
      } else if (archiveOrProgress && typeof archiveOrProgress === 'object') {
        targetArchive = archiveOrProgress;
        onProgress = maybeProgress;
      } else {
        targetArchive = stagedArchive;
        onProgress = maybeProgress;
      }

      if (!targetArchive) {
        return {
          ok: false,
          reason: 'ARCHIVE_CORRUPTED',
          message: 'Tidak ada berkas paket yang dipilih untuk dipasang.',
        };
      }

      console.log('[AppContext] Menjalankan installPackageFromBuffer...');
      const result = await installPackageFromBuffer(targetArchive.buffer, {
        onProgress,
      });

      if (result.ok && result.packageId && result.loadedPackage) {
        const manifest = result.loadedPackage.manifest;
        const formattedTitle = manifest.packageId
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        console.log('[AppContext] Menyimpan paket terpasang ke database SQLite...');
        await packageRepo.savePackage({
          package_id: manifest.packageId,
          language_id: manifest.languageId,
          dialect_id: manifest.dialectId,
          package_version: manifest.packageVersion,
          schema_version: manifest.schemaVersion,
          title: formattedTitle,
          bundle_path: result.bundleArchivePath ?? `packages/installed/${manifest.packageId}/bundle.clata`,
          installed_at: new Date().toISOString(),
          is_active: 1,
        });

        // Persistensikan konten pembelajaran (kata, kalimat, dialog, unit) ke SQLite agar tahan reload
        await packageRepo.savePackageContent(
          manifest.packageId,
          result.loadedPackage,
          targetArchive.buffer,
        );

        await packageRepo.setActivePackage(manifest.packageId);
        await settingsRepo.setActivePackageId(manifest.packageId);

        setActivePackageId(manifest.packageId);
        setActivePackageData(result.loadedPackage);

        const updated = await packageRepo.getAllPackages();
        setInstalledPackages(updated);
        console.log('[AppContext] Pemasangan paket dan aktivasi berhasil tersimpan.');
      }

      return result;
    },
    [stagedArchive],
  );

  const completeOnboarding = useCallback(async (): Promise<void> => {
    await settingsRepo.setOnboardingCompleted(true);
    setIsOnboardingCompleted(true);
  }, []);

  const resetAppState = useCallback(async (): Promise<void> => {
    await settingsRepo.clearAllSettings();
    await packageRepo.clearAllPackages();
    setIsOnboardingCompleted(false);
    setActivePackageId(null);
    setActivePackageData(null);
    setInstalledPackages([]);
    setStagedArchive(null);
  }, []);

  const switchActivePackage = useCallback(async (packageId: string): Promise<void> => {
    await packageRepo.setActivePackage(packageId);
    await settingsRepo.setActivePackageId(packageId);
    const content = await packageRepo.getPackageContent(packageId);
    setActivePackageId(packageId);
    setActivePackageData(content);
    const updated = await packageRepo.getAllPackages();
    setInstalledPackages(updated);
  }, []);

  const resetPackageProgress = useCallback(async (packageId: string): Promise<void> => {
    const db = await getAppDatabase();
    await db.run('DELETE FROM unit_session_progress WHERE package_id = ?', [packageId]);
    await db.run('DELETE FROM daily_streaks WHERE package_id = ?', [packageId]);
    await db.run('DELETE FROM challenge_progress WHERE package_id = ?', [packageId]);
    await db.run('DELETE FROM word_views WHERE package_id = ?', [packageId]);
    await refreshState();
  }, [refreshState]);

  const contextValue = useMemo<AppContextValue>(
    () => ({
      isInitialized,
      isOnboardingCompleted,
      activePackageId,
      activePackageData,
      installedPackages,
      stagedArchive,
      setStagedArchive,
      installStagedPackage,
      completeOnboarding,
      resetAppState,
      resetPackageProgress,
      switchActivePackage,
      refreshInstalledPackages: refreshState,
    }),
    [
      isInitialized,
      isOnboardingCompleted,
      activePackageId,
      activePackageData,
      installedPackages,
      stagedArchive,
      installStagedPackage,
      completeOnboarding,
      resetAppState,
      resetPackageProgress,
      switchActivePackage,
      refreshState,
    ],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp harus digunakan di dalam <AppProvider>');
  }
  return context;
}
