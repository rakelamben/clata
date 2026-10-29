import { describe, expect, it } from 'vitest';

import { validatePackageEntries } from '../../../src/features/packages/infrastructure/packageValidator';
import type { PackageArchiveEntry } from '../../../src/features/packages/domain/packageTypes';

const manifest = {
  packageId: 'jawa-mataraman', languageId: 'jv', dialectId: 'mataraman', packageVersion: '1.0.0', schemaVersion: 1,
  minimumAppVersion: '1.0.0', registerMapping: { familiar: 'ngoko', neutral: 'ngoko-alus', formal: 'krama' },
  orthographyReference: 'fixture', createdAt: '2026-10-29T00:00:00.000Z', itemCounts: { words: 1 },
  files: [], keyId: 'test-key', signatureReference: 'tanda-tangan',
};

const verifier = { verify: async () => true };
const options = { appVersion: '1.0.0', supportedSchemaVersion: 1, languageId: 'jv', dialectId: 'mataraman', publicKeys: [{ keyId: 'test-key', state: 'active' as const, publicKey: new Uint8Array(32) }], signatureVerifier: verifier };

describe('package validator', () => {
  it('rejects unsafe paths before trusting content', async () => {
    const entries: PackageArchiveEntry[] = [{ path: '../manifest.json', data: new TextEncoder().encode('{}') }];
    await expect(validatePackageEntries(entries, options)).resolves.toEqual({ ok: false, reason: 'UNSAFE_PATH' });
  });

  it('rejects an unknown signing key', async () => {
    const entries: PackageArchiveEntry[] = [
      { path: 'manifest.json', data: new TextEncoder().encode(JSON.stringify({ ...manifest, keyId: 'unknown' })) },
      { path: 'tanda-tangan', data: new TextEncoder().encode(JSON.stringify({ algorithm: 'Ed25519', keyId: 'unknown', encoding: 'base64url', signature: '' })) },
    ];
    await expect(validatePackageEntries(entries, options)).resolves.toEqual({ ok: false, reason: 'UNKNOWN_KEY' });
  });

  it('rejects an archive over the compressed-size boundary supplied by the archive reader', async () => {
    await expect(validatePackageEntries([], { ...options, archiveSizeBytes: 10 * 1024 * 1024 + 1 })).resolves.toEqual({ ok: false, reason: 'ARCHIVE_TOO_LARGE' });
  });
});
