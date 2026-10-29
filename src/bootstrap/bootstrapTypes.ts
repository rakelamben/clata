import type { AppError } from '../domain/errors/AppError';

export type StartupStep =
  | 'loadMetadata'
  | 'openDatabase'
  | 'runMigrations'
  | 'recoverInterruptedWork'
  | 'rebuildDerivedCaches'
  | 'verifyBundledPackage'
  | 'ready';

export type StartupStatus =
  | { status: 'idle' }
  | { status: 'running'; step: StartupStep }
  | { status: 'ready'; onboardingCompleted: boolean }
  | { status: 'recovery-required'; error: AppError };

export interface StartupRunner {
  run(): Promise<StartupStatus>;
}

export interface StartupMetadataStore {
  getOnboardingCompleted(): Promise<boolean>;
  setOnboardingCompleted(completed: boolean): Promise<void>;
}
