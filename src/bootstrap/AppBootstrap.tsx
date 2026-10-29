import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../ui/theme';
import type { DependencyContainer } from './DependencyContainer';
import type { StartupStatus } from './bootstrapTypes';
import { createStartupRunner } from './startupRecovery';
import { systemClock } from '../infrastructure/clock/systemClock';
import { developmentDeviceIdentity } from '../infrastructure/device/deviceIdentity';
import { consoleLogger } from '../infrastructure/logging/consoleLogger';
import { bundledPackageSource } from '../features/packages/infrastructure/bundledPackageSource';
import { bundledPublicKeys } from '../features/packages/infrastructure/keyRegistry';
import { SQLitePackageStorage } from '../features/packages/infrastructure/sqlitePackageStorage';
import { ed25519SignatureVerifier } from '../features/packages/infrastructure/signatureVerifier';
import { validatePackageEntries } from '../features/packages/infrastructure/packageValidator';
import { verifyBundledPackage } from '../features/packages/application/verifyBundledPackage';
import { recoverPackageInstall } from '../features/packages/application/recoverPackageInstall';
import { PackageValidationError } from '../features/packages/domain/packageErrors';
import { openExpoSQLiteDatabase, runMigrations, SQLiteMetadataStore, SQLiteSettingsRepository } from '../infrastructure/database';
import { SQLiteProgressRepository } from '../features/progress/data/progressRepository';
import { LocalProfileRepository } from '../features/onboarding/data/localProfileRepository';
import { PackageRepository } from '../features/packages/data/packageRepository';
import type { LocalProfile, OnboardingState } from '../domain/onboarding/onboardingTypes';
import { getAgeCategory, validateBirthYear } from '../domain/onboarding/ageGate';
import { loadOnboardingState } from '../features/onboarding/application/loadOnboardingState';
import type { DatabasePort } from '../infrastructure/database/DatabasePort';
import { SQLiteVocabularyRepository } from '../features/vocabulary/data/sqliteVocabularyRepository';
import { ExpoAudioAdapter } from '../infrastructure/audio/ExpoAudioAdapter';
import { BundledAudioSourceResolver } from '../infrastructure/audio/BundledAudioSourceResolver';
import { SQLitePracticeRepository } from '../features/practice/data/sqlitePracticeRepository';
import { SQLiteDialogueRepository } from '../features/dialogues/data/sqliteDialogueRepository';
import { SQLiteChallengeRepository } from '../features/challenges/data/sqliteChallengeRepository';
import { ResetPackageProgressUseCase } from '../features/settings/application/resetPackageProgress';
import { ClearAllLocalDataUseCase } from '../features/settings/application/clearAllLocalData';
import { GetAboutMetadataUseCase } from '../features/settings/application/getAboutMetadata';
import { GetStorageInfoUseCase } from '../features/settings/application/getStorageInfo';

type AppRuntime = {
  container: DependencyContainer;
  startup: StartupStatus;
  retryStartup: () => Promise<void>;
  profile: LocalProfile | null;
  onboardingState: OnboardingState;
  completeOnboarding: (input: { birthYear: number; packageId: string; introDismissed: boolean; localWarningAcknowledged: boolean }) => Promise<void>;
};

const RuntimeContext = createContext<AppRuntime | null>(null);

function createContainer(): DependencyContainer {
  const logger = consoleLogger;
  let databasePromise: Promise<import('../infrastructure/database/DatabasePort').DatabasePort> | null = null;
  const database = {
    get: async () => {
      if (!databasePromise) throw new Error('Database belum dibuka.');
      return databasePromise;
    },
    open: async () => {
      if (!databasePromise) {
        databasePromise = openExpoSQLiteDatabase();
        try { await databasePromise; } catch (error) { databasePromise = null; throw error; }
      } else await databasePromise;
    },
    migrate: async () => { const result = await runMigrations(await database.get()); if (!result.ok) throw result.error; },
  };
  const lazyDatabase: DatabasePort = {
    exec: async (sql) => (await database.get()).exec(sql),
    run: async (sql, params) => (await database.get()).run(sql, params),
    get: async (sql, params) => (await database.get()).get(sql, params),
    all: async (sql, params) => (await database.get()).all(sql, params),
    transaction: async (work) => (await database.get()).transaction(work),
  };
  const metadata = new SQLiteMetadataStore(database.get);
  const settings = new SQLiteSettingsRepository(database.get);
  const profile = new LocalProfileRepository(database.get, systemClock);
  const packageRepository = new PackageRepository(database.get);
  const packageStorage = new SQLitePackageStorage(database.get);
  const progress = new SQLiteProgressRepository(lazyDatabase, developmentDeviceIdentity.getDeviceId());
  const vocabulary = new SQLiteVocabularyRepository(lazyDatabase);
  const audio = new ExpoAudioAdapter();
  const audioSources = new BundledAudioSourceResolver();
  const practice = new SQLitePracticeRepository(lazyDatabase, progress, systemClock, developmentDeviceIdentity.getDeviceId());
  const dialogue = new SQLiteDialogueRepository(lazyDatabase, progress, systemClock, developmentDeviceIdentity.getDeviceId());
  const challenge = new SQLiteChallengeRepository(lazyDatabase, systemClock);
  const resetPackageProgress = new ResetPackageProgressUseCase(progress, () => systemClock.now().toISOString());
  const clearAllLocalData = new ClearAllLocalDataUseCase(lazyDatabase, settings, () => systemClock.now().toISOString());
  const getAboutMetadata = new GetAboutMetadataUseCase(packageRepository);
  const getStorageInfo = new GetStorageInfoUseCase(lazyDatabase);
  const verifyBundle = async () => {
    const result = await verifyBundledPackage(
      bundledPackageSource,
      { validate: (entries) => validatePackageEntries(entries, { appVersion: '1.0.0', supportedSchemaVersion: 1, languageId: 'jv', dialectId: 'mataraman', publicKeys: bundledPublicKeys, signatureVerifier: ed25519SignatureVerifier }) },
      packageStorage,
    );
    if (!result.ok) throw new PackageValidationError(result.reason);
  };
  return Object.freeze({
    clock: systemClock,
    deviceIdentity: developmentDeviceIdentity,
    logger,
    metadata,
    settings,
    profile,
    packageRepository,
    vocabulary,
    progressRepository: progress,
    audio,
    audioSources,
    practice,
    dialogue,
    challenge,
    resetPackageProgress,
    clearAllLocalData,
    getAboutMetadata,
    getStorageInfo,
    database,
    packages: { bundledSource: bundledPackageSource, storage: packageStorage, installBundled: verifyBundle },
    startup: createStartupRunner({ logger, metadata, steps: { openDatabase: database.open, runMigrations: database.migrate, recoverInterruptedWork: () => recoverPackageInstall(packageStorage), rebuildDerivedCaches: async () => { const today = systemClock.now().toISOString().slice(0, 10); const result = await progress.rebuildAll(today); if (!result.ok) throw result.error; }, verifyBundledPackage: verifyBundle }, isConfigured: () => databasePromise !== null }),
  });
}

export function AppBootstrap({ children }: PropsWithChildren) {
  const container = useMemo(() => createContainer(), []);
  const [startup, setStartup] = useState<StartupStatus>({ status: 'idle' });
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>('loading');
  const startupInFlight = useRef<Promise<void> | null>(null);

  const runStartup = useCallback(async () => {
    if (startupInFlight.current) return startupInFlight.current;

    const startupPromise = (async () => {
      setStartup({ status: 'running', step: 'loadMetadata' });
      const result = await container.startup.run();
      setStartup(result);
      const nextProfile = await container.profile.getProfile();
      setProfile(nextProfile);
      setOnboardingState(result.status === 'ready' ? await loadOnboardingState(container.profile, container.packageRepository, container.clock, result.onboardingCompleted) : 'error');
    })();
    startupInFlight.current = startupPromise;
    try {
      await startupPromise;
    } finally {
      startupInFlight.current = null;
    }
  }, [container]);

  const completeOnboarding = useCallback(async (input: { birthYear: number; packageId: string; introDismissed: boolean; localWarningAcknowledged: boolean }) => {
    const validation = validateBirthYear(input.birthYear, container.clock.now());
    if (validation) throw new Error(validation);
    const category = getAgeCategory(input.birthYear, container.clock);
    if (category === 'blocked') throw new Error('Usia minimal untuk menggunakan Clata adalah 10 tahun.');
    if (!input.localWarningAcknowledged) throw new Error('Konfirmasi penyimpanan data lokal diperlukan.');
    if (!(await container.packageRepository.isActive(input.packageId))) throw new Error('Paket bahasa belum siap digunakan.');
    await container.profile.completeOnboarding(input.birthYear, input.packageId);
    setProfile(await container.profile.getProfile());
    setOnboardingState('ready');
    setStartup((current) => current.status === 'ready' ? { ...current, onboardingCompleted: true } : current);
  }, [container]);

  useEffect(() => {
    void Promise.resolve().then(runStartup);
  }, [runStartup]);

  const runtime = useMemo<AppRuntime>(() => ({ container, startup, profile, onboardingState, retryStartup: runStartup, completeOnboarding }), [completeOnboarding, container, onboardingState, profile, runStartup, startup]);

  if (startup.status === 'idle' || startup.status === 'running') {
    return (
      <RuntimeContext.Provider value={runtime}>
        <View style={styles.centered} accessibilityLabel="Menyiapkan Clata">
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.message}>Menyiapkan Clata…</Text>
        </View>
      </RuntimeContext.Provider>
    );
  }

  if (startup.status === 'recovery-required') {
    return (
      <RuntimeContext.Provider value={runtime}>
        <View style={styles.centered}>
          <Text accessibilityRole="header" style={styles.title}>Clata belum siap</Text>
          <Text style={styles.message}>{startup.error.recoverable ? 'Clata belum siap digunakan. Coba lagi.' : 'Clata tidak dapat dimulai.'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Coba lagi menyiapkan Clata" onPress={() => void runStartup()} style={styles.button}>
            <Text style={styles.buttonLabel}>Coba lagi</Text>
          </Pressable>
        </View>
      </RuntimeContext.Provider>
    );
  }

  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export function useAppRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error('useAppRuntime harus digunakan di dalam AppBootstrap.');
  return runtime;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background },
  title: { color: colors.navy, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.textSecondary, fontSize: 16, textAlign: 'center' },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, borderRadius: radii.control, backgroundColor: colors.primary },
  buttonLabel: { color: colors.surface, fontSize: 16, fontWeight: '700' },
});
