import type { BundledPackageSource, BundledPackageVerifier } from '../../packages/application/verifyBundledPackage';
import { verifyBundledPackage } from '../../packages/application/verifyBundledPackage';
import type { PackageStorage } from '../../packages/application/installPackage';
import type { PackageValidationResult } from '../../packages/domain/packageTypes';

export async function installBundledPackageForOnboarding(source: BundledPackageSource, verifier: BundledPackageVerifier, storage: PackageStorage): Promise<PackageValidationResult> {
  return verifyBundledPackage(source, verifier, storage);
}
