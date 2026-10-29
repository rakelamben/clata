import { comparePackageVersion } from '../domain/packageVersion';
import type { PackageArchiveEntry, PackageValidationResult } from '../domain/packageTypes';
import { installValidatedPackage, type PackageStorage } from './installPackage';
import { normalizePackagePath } from '../infrastructure/pathNormalization';

export interface BundledPackageSource {
  read(): Promise<PackageArchiveEntry[]>;
}

export interface BundledPackageVerifier {
  validate(entries: PackageArchiveEntry[]): Promise<PackageValidationResult>;
}

export async function verifyBundledPackage(source: BundledPackageSource, verifier: BundledPackageVerifier, storage: PackageStorage): Promise<PackageValidationResult> {
  const entries = await source.read();
  const validation = await verifier.validate(entries);
  if (!validation.ok) return validation;
  const active = await storage.getActive(validation.identity.packageId);
  if (active) {
    const comparison = comparePackageVersion(validation.identity.packageVersion, active.packageVersion);
    if (comparison < 0) return { ok: false, reason: 'LOWER_PACKAGE_VERSION' };
    if (comparison === 0) return validation;
  }
  const normalizedEntries = entries.map((entry) => {
    const normalized = normalizePackagePath(entry.path);
    return normalized.ok ? { ...entry, path: normalized.path } : entry;
  });
  return installValidatedPackage(storage, validation, normalizedEntries);
}
