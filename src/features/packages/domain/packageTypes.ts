export type PackageSource = 'bundled' | 'download' | 'file';

export type PackageIdentity = {
  packageId: string;
  languageId: string;
  dialectId: string;
  packageVersion: string;
  schemaVersion: number;
};

export type PackageFile = {
  path: string;
  sizeBytes: number;
  sha256: string;
};

export type PackageManifest = PackageIdentity & {
  minimumAppVersion: string;
  registerMapping: Record<string, string>;
  orthographyReference: string;
  createdAt: string;
  itemCounts: Record<string, number>;
  files: PackageFile[];
  keyId: string;
  signatureReference: string;
};

export type PackageArchiveEntry = {
  path: string;
  data: Uint8Array;
  archiveSizeBytes?: number;
};

export type PackageInstallState = 'staged' | 'validating' | 'ready-to-activate' | 'active' | 'failed' | 'recoverable';

export type PackageRejectReason =
  | 'ARCHIVE_TOO_LARGE' | 'TOO_MANY_ENTRIES' | 'TOTAL_UNCOMPRESSED_TOO_LARGE' | 'FILE_TOO_LARGE'
  | 'PATH_TOO_DEEP' | 'JSON_TOO_LARGE' | 'UNSAFE_PATH' | 'DUPLICATE_PATH' | 'INVALID_MANIFEST'
  | 'UNSUPPORTED_SCHEMA' | 'APP_VERSION_TOO_LOW' | 'INVALID_SIGNATURE' | 'UNKNOWN_KEY' | 'REVOKED_KEY'
  | 'NON_CANONICAL_SIGNATURE' | 'CHECKSUM_MISMATCH' | 'SIZE_MISMATCH' | 'UNSUPPORTED_LANGUAGE'
  | 'UNSUPPORTED_DIALECT' | 'LOWER_PACKAGE_VERSION' | 'DUPLICATE_PACKAGE_VERSION' | 'INVALID_REFERENCE'
  | 'INVALID_DIALOG_GRAPH' | 'INVALID_AUDIO_METADATA' | 'UNVERIFIED_PUBLIC_CONTENT' | 'INSUFFICIENT_STORAGE'
  | 'INSTALL_INTERRUPTED' | 'INVALID_VERSION' | 'INVALID_CONTENT';

export type PackageValidationResult =
  | { ok: true; identity: PackageIdentity; fileCount: number; totalBytes: number }
  | { ok: false; reason: PackageRejectReason };

export type PackageKeyState = 'active' | 'retired' | 'revoked';

export type PackagePublicKey = {
  keyId: string;
  state: PackageKeyState;
  publicKey: Uint8Array;
};
