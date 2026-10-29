import { createAppError, type AppError } from '../../../domain/errors/AppError';

export class ChallengeError extends Error {
  constructor(message: string, readonly recoverable = true) {
    super(message);
    this.name = 'ChallengeError';
  }
}

export function createChallengeError(
  _code: string,
  message: string,
  details?: { cause?: unknown; [key: string]: unknown },
): AppError {
  return createAppError('UNKNOWN', message, { recoverable: true, cause: details?.cause ?? details });
}
