export interface ResetCommand {
  commandId: string;
  packageId: string;
  issuedAt: string;
  localAppliedAt: string;
  tombstoneVersion: number;
  boundaryLocalSequence: number;
  boundaryDeviceTime: string;
  boundaryEventId: string;
  status: 'local_pending' | 'synced';
}

export interface PackageResetBoundary {
  packageId: string;
  resetCommandId: string;
  boundaryLocalSequence: number;
  boundaryDeviceTime: string;
  boundaryEventId: string;
  updatedAt: string;
}

export interface StorageInfo {
  databaseSizeBytes: number;
  databaseSizeFormatted: string;
  packageId: string;
  packageName: string;
  packageVersion: string;
  totalEventsCount: number;
  learnedItemsCount: number;
}
