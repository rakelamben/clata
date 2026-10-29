import type { AppError } from '../../domain/errors/AppError';

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };
