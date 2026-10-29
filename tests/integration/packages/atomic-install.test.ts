import { describe, expect, it } from 'vitest';

import { installValidatedPackage, type PackageStorage } from '../../../src/features/packages/application/installPackage';
import type { PackageArchiveEntry, PackageIdentity } from '../../../src/features/packages/domain/packageTypes';

class FakePackageStorage implements PackageStorage {
  active: PackageIdentity | null = null;
  staged: PackageIdentity | null = null;
  shouldFail = false;

  async getActive() { return this.active; }
  async stage(identity: PackageIdentity) { this.staged = identity; }
  async activate(packageId: string) {
    if (this.shouldFail) throw new Error('activation failed');
    if (!this.staged || this.staged.packageId !== packageId) throw new Error('missing staging');
    this.active = this.staged;
    this.staged = null;
  }
  async discardStaging() { this.staged = null; }
  async getInstallState() { return null; }
  async recover() { this.staged = null; }
}

const entries: PackageArchiveEntry[] = [{ path: 'manifest.json', data: new Uint8Array([1]) }];
const valid = { ok: true as const, identity: { packageId: 'jawa-mataraman', languageId: 'jv', dialectId: 'mataraman', packageVersion: '1.0.0', schemaVersion: 1 }, fileCount: 1, totalBytes: 1 };

describe('atomic package install', () => {
  it('activates only after staging succeeds', async () => {
    const storage = new FakePackageStorage();
    await installValidatedPackage(storage, valid, entries);
    expect(storage.active?.packageVersion).toBe('1.0.0');
    expect(storage.staged).toBeNull();
  });

  it('cleans staging when activation fails', async () => {
    const storage = new FakePackageStorage();
    storage.shouldFail = true;
    await expect(installValidatedPackage(storage, valid, entries)).rejects.toThrow('activation failed');
    expect(storage.active).toBeNull();
    expect(storage.staged).toBeNull();
  });
});
