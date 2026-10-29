import type { AppError } from '../errors/AppError';

export type OperationState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: AppError }
  | { status: 'offline'; retry: () => Promise<void> }
  | { status: 'retrying'; attempt: number };
