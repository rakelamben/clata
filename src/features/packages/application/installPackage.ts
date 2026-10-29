import type { PackageArchiveEntry, PackageIdentity, PackageInstallState, PackageValidationResult } from '../domain/packageTypes';

export interface PackageStorage {
  getActive(packageId: string): Promise<PackageIdentity | null>;
  stage(identity: PackageIdentity, entries: PackageArchiveEntry[]): Promise<void>;
  activate(packageId: string): Promise<void>;
  discardStaging(packageId: string): Promise<void>;
  getInstallState(packageId: string): Promise<PackageInstallState | null>;
  recover(): Promise<void>;
}

export async function installValidatedPackage(storage: PackageStorage, validation: PackageValidationResult, entries: PackageArchiveEntry[]) {
  if (!validation.ok) return validation;
  await storage.stage(validation.identity, entries);
  try {
    await storage.activate(validation.identity.packageId);
    return validation;
  } catch (error) {
    await storage.discardStaging(validation.identity.packageId);
    throw error;
  }
}
