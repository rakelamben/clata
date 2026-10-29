export type SettingsErrorCode =
  | 'RESET_FAILED'
  | 'CLEAR_DATA_FAILED'
  | 'PACKAGE_NOT_FOUND'
  | 'METADATA_LOAD_FAILED'
  | 'TRANSACTION_ABORTED';

export class SettingsError extends Error {
  constructor(
    public readonly code: SettingsErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

export function createSettingsError(
  code: SettingsErrorCode,
  message: string,
  options?: { cause?: unknown }
): SettingsError {
  return new SettingsError(code, message, options?.cause);
}
