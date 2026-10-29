import type { PackageArchiveEntry, PackageIdentity, PackageInstallState } from '../domain/packageTypes';
import type { PackageStorage } from '../application/installPackage';

export class InMemoryPackageStorage implements PackageStorage {
  private active: PackageIdentity | null = null;
  private staged: { identity: PackageIdentity; entries: PackageArchiveEntry[] } | null = null;

  async getActive(packageId: string) {
    return this.active?.packageId === packageId ? this.active : null;
  }

  async stage(identity: PackageIdentity, entries: PackageArchiveEntry[]) {
    this.staged = { identity, entries };
  }

  async activate(packageId: string) {
    if (!this.staged || this.staged.identity.packageId !== packageId) throw new Error('Package staging tidak ditemukan.');
    this.active = this.staged.identity;
    this.staged = null;
  }

  async discardStaging(packageId: string) {
    if (this.staged?.identity.packageId === packageId) this.staged = null;
  }

  async getInstallState(packageId: string): Promise<PackageInstallState | null> {
    if (this.staged?.identity.packageId === packageId) return 'staged';
    if (this.active?.packageId === packageId) return 'active';
    return null;
  }

  async recover() {
    this.staged = null;
  }
}
