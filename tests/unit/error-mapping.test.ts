import { describe, expect, it } from 'vitest';

import { createAppError } from '../../src/domain/errors/AppError';
import { mapErrorToMessage } from '../../src/shared/errors/mapErrorToMessage';

describe('application errors', () => {
  it('maps technical errors to Indonesian user-facing copy', () => {
    const error = createAppError('STARTUP_FAILED', 'internal', { recoverable: true });

    expect(mapErrorToMessage(error)).toBe('Clata belum siap digunakan. Coba lagi.');
    expect(error.message).toBe('internal');
  });
});
