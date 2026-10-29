import type { PackageRejectReason } from './packageTypes';

export class PackageValidationError extends Error {
  readonly reason: PackageRejectReason;

  constructor(reason: PackageRejectReason) {
    super(`Package rejected: ${reason}`);
    this.name = 'PackageValidationError';
    this.reason = reason;
  }
}
