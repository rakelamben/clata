import { describe, expect, it } from 'vitest';

import { normalizePackagePath } from '../../../src/features/packages/infrastructure/pathNormalization';

describe('package path normalization', () => {
  it('normalizes separators and rejects traversal/absolute paths', () => {
    expect(normalizePackagePath('audio\\kata\\hello.opus')).toEqual({ ok: true, path: 'audio/kata/hello.opus' });
    expect(normalizePackagePath('../manifest.json')).toEqual({ ok: false, reason: 'UNSAFE_PATH' });
    expect(normalizePackagePath('/manifest.json')).toEqual({ ok: false, reason: 'UNSAFE_PATH' });
    expect(normalizePackagePath('C:/manifest.json')).toEqual({ ok: false, reason: 'UNSAFE_PATH' });
  });
});
