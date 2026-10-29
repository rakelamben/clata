import { createAppError, type AppError } from '../../../domain/errors/AppError';

export class DialogueError extends Error {
  constructor(message: string, readonly recoverable = true) {
    super(message);
    this.name = 'DialogueError';
  }
}

export function createDialogueError(
  _code: string,
  message: string,
  details?: { cause?: unknown; [key: string]: unknown },
): AppError {
  return createAppError('UNKNOWN', message, { recoverable: true, cause: details?.cause ?? details });
}
