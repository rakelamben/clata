import { comparePackageVersion } from '../domain/packageVersion';
import type { PackageArchiveEntry, PackageValidationResult } from '../domain/packageTypes';
import { installValidatedPackage, type PackageStorage } from './installPackage';
import { normalizePackagePath } from '../infrastructure/pathNormalization';
import { sha256 } from '@noble/hashes/sha2.js';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const normalized = chunks.map((chunk) => (chunk instanceof Uint8Array ? chunk : Uint8Array.from(chunk as unknown as number[])));
  const total = normalized.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of normalized) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

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
    if (comparison === 0) {
      if (active.archiveChecksum) {
        const currentChecksum = toHex(sha256(concat(entries.map((e) => e.data))));
        if (active.archiveChecksum === currentChecksum) {
          return validation;
        }
      } else {
        return validation;
      }
    }
  }
  const normalizedEntries = entries.map((entry) => {
    const normalized = normalizePackagePath(entry.path);
    return normalized.ok ? { ...entry, path: normalized.path } : entry;
  });
  return installValidatedPackage(storage, validation, normalizedEntries);
}
