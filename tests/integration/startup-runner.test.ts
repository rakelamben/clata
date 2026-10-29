import { describe, expect, it } from 'vitest';

import { createStartupRunner } from '../../src/bootstrap/startupRecovery';
import type { Logger } from '../../src/domain/ports/Logger';

describe('startup runner', () => {
  it('runs the runtime startup contract and reads onboarding metadata', async () => {
    const messages: string[] = [];
    const logger: Logger = {
      info: (message) => messages.push(message),
      warn: () => undefined,
      error: () => undefined,
    };
    const metadata = {
      completed: true,
      async getOnboardingCompleted() { return this.completed; },
      async setOnboardingCompleted(completed: boolean) { this.completed = completed; },
    };

    const result = await createStartupRunner({ logger, metadata }).run();

    expect(result).toEqual({ status: 'ready', onboardingCompleted: true });
    expect(messages).toHaveLength(6);
  });

  it('returns recoverable startup state when a startup dependency fails', async () => {
    const logger: Logger = {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    };
    const metadata = {
      async getOnboardingCompleted() { return false; },
      async setOnboardingCompleted() { return undefined; },
    };

    const result = await createStartupRunner({
      logger,
      metadata,
      steps: { runMigrations: async () => { throw new Error('migration failed'); } },
    }).run();

    expect(result.status).toBe('recovery-required');
    if (result.status === 'recovery-required') {
      expect(result.error.recoverable).toBe(true);
    }
  });

  it('can retry a failed startup without duplicating successful step effects', async () => {
    let attempts = 0;
    let metadataLoads = 0;
    const logger: Logger = { info: () => undefined, warn: () => undefined, error: () => undefined };
    const metadata = { async getOnboardingCompleted() { return false; }, async setOnboardingCompleted() {} };
    const runner = createStartupRunner({
      logger,
      metadata,
      steps: {
        loadMetadata: async () => { metadataLoads += 1; },
        runMigrations: async () => { attempts += 1; if (attempts === 1) throw new Error('retry'); },
      },
    });

    expect((await runner.run()).status).toBe('recovery-required');
    expect((await runner.run()).status).toBe('ready');
    expect(attempts).toBe(2);
    expect(metadataLoads).toBe(1);
  });

  it('shares concurrent startup calls through one in-flight promise', async () => {
    let runs = 0;
    const logger: Logger = { info: () => undefined, warn: () => undefined, error: () => undefined };
    const metadata = { async getOnboardingCompleted() { return false; }, async setOnboardingCompleted() {} };
    const runner = createStartupRunner({
      logger,
      metadata,
      steps: { loadMetadata: async () => { runs += 1; await Promise.resolve(); } },
    });

    const first = runner.run();
    const second = runner.run();

    expect(first).toBe(second);
    await Promise.all([first, second]);
    expect(runs).toBe(1);
  });

  it('allows production startup when required adapters are configured', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const logger: Logger = { info: () => undefined, warn: () => undefined, error: () => undefined };
    const metadata = { async getOnboardingCompleted() { return false; }, async setOnboardingCompleted() {} };
    const runner = createStartupRunner({ logger, metadata, isConfigured: () => true });

    expect((await runner.run()).status).toBe('ready');
    process.env.NODE_ENV = previous;
  });
});
