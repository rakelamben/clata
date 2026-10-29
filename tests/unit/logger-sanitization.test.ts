import { describe, expect, it } from 'vitest';

import { consoleLogger, sanitizeForLog } from '../../src/infrastructure/logging/consoleLogger';

describe('logger sanitization', () => {
  it('redacts nested sensitive values and bounds payload depth', () => {
    const value = sanitizeForLog({
      email: 'person@example.com',
      nested: { token: 'secret', safe: { deeper: { value: 'hidden' } } },
    }) as Record<string, unknown>;

    expect(value.email).toBe('[REDACTED]');
    expect(value.nested).toEqual({ token: '[REDACTED]', safe: { deeper: { value: '[TRUNCATED]' } } });
  });

  it('redacts common secrets in dynamic messages', () => {
    const info = console.info;
    let logged = '';
    console.info = ((message: string) => { logged = message; }) as typeof console.info;

    consoleLogger.info('Authorization Bearer abc email person@example.com');

    console.info = info;
    expect(logged).toBe('Authorization Bearer [REDACTED] email [REDACTED_EMAIL]');
  });

  it('redacts secrets embedded in context string values', () => {
    const value = sanitizeForLog({ details: 'token=abc123 birth year 1990' });

    expect(value).toEqual({ details: 'token=[REDACTED] birth year=[REDACTED]' });
  });
});
