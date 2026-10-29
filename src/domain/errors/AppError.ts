export type AppErrorCode =
  | 'STARTUP_FAILED'
  | 'MIGRATION_FAILED'
  | 'RECOVERY_REQUIRED'
  | 'INVALID_CONFIGURATION'
  | 'UNSUPPORTED_PLATFORM'
  | 'UNKNOWN';

export type AppError = {
  code: AppErrorCode;
  message: string;
  recoverable: boolean;
  cause?: unknown;
};

export function createAppError(
  code: AppErrorCode,
  message: string,
  options: Pick<AppError, 'recoverable' | 'cause'> = { recoverable: false },
): AppError {
  return { code, message, ...options };
}
