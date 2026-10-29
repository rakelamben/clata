import type { PackageStorage } from './installPackage';

export async function recoverPackageInstall(storage: PackageStorage) {
  await storage.recover();
}
