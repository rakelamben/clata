import { describe, expect, it } from 'vitest';

import { comparePackageVersion } from '../../../src/features/packages/domain/packageVersion';
import { verifyBundledPackage } from '../../../src/features/packages/application/verifyBundledPackage';
import type { PackageStorage } from '../../../src/features/packages/application/installPackage';
import type { PackageArchiveEntry, PackageIdentity, PackageValidationResult } from '../../../src/features/packages/domain/packageTypes';

describe('bundled update evidence', () => {
  it('recognizes a higher SemVer bundle as an update', () => {
    expect(comparePackageVersion('1.1.0', '1.0.0')).toBe(1);
  });

  it('triggers package update if same SemVer but archive checksum has changed', async () => {
    let staged = false;
    let activated = false;

    const mockStorage: PackageStorage = {
      async getActive() {
        return {
          packageId: 'jawa-mataraman',
          languageId: 'jv',
          dialectId: 'mataraman',
          packageVersion: '1.0.0',
          schemaVersion: 1,
          archiveChecksum: 'old-outdated-checksum',
        };
      },
      async stage() {
        staged = true;
      },
      async activate() {
        activated = true;
      },
      async discardStaging() {},
      async getInstallState() {
        return 'active';
      },
      async recover() {},
    };

    const mockSource = {
      async read(): Promise<PackageArchiveEntry[]> {
        return [
          { path: 'manifest.json', data: new Uint8Array([1, 2, 3]) },
          { path: 'challenge.json', data: new Uint8Array([4, 5, 6]) },
        ];
      },
    };

    const mockVerifier = {
      async validate(entries: PackageArchiveEntry[]): Promise<PackageValidationResult> {
        return {
          ok: true,
          identity: {
            packageId: 'jawa-mataraman',
            languageId: 'jv',
            dialectId: 'mataraman',
            packageVersion: '1.0.0',
            schemaVersion: 1,
          },
          fileCount: entries.length,
          totalBytes: entries.reduce((s, e) => s + e.data.byteLength, 0),
        };
      },
    };

    const result = await verifyBundledPackage(mockSource, mockVerifier, mockStorage);
    expect(result.ok).toBe(true);
    expect(staged).toBe(true);
    expect(activated).toBe(true);
  });
});
