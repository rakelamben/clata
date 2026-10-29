export const PACKAGE_LIMITS = {
  maxArchiveBytes: 10 * 1024 * 1024,
  maxEntries: 1000,
  maxUncompressedBytes: 30 * 1024 * 1024,
  maxFileBytes: 2 * 1024 * 1024,
  maxPathDepth: 8,
  maxJsonBytes: 5 * 1024 * 1024,
  maxAudioDurationSeconds: 6,
} as const;
