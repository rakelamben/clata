import { createAppError } from '../domain/errors/AppError';
import type { DependencyContainer } from './DependencyContainer';
import type { StartupRunner, StartupStatus, StartupStep } from './bootstrapTypes';

const startupSteps: StartupStep[] = [
  'loadMetadata',
  'openDatabase',
  'runMigrations',
  'recoverInterruptedWork',
  'verifyBundledPackage',
  'rebuildDerivedCaches',
];

/**
 * Startup runner with retry-safe, single-flight execution. Adapters are supplied
 * by the composition root so the runner remains framework independent.
 */
export function createStartupRunner(dependencies: Pick<DependencyContainer, 'logger' | 'metadata'> & {
  steps?: Partial<Record<StartupStep, () => Promise<void>>>;
  isConfigured?: () => boolean;
}): StartupRunner {
  const completedSteps = new Set<StartupStep>();
  let inFlight: Promise<StartupStatus> | null = null;

  return {
    run(): Promise<StartupStatus> {
      if (inFlight) return inFlight;

      inFlight = (async () => {
        try {
          for (const step of startupSteps) {
            if (completedSteps.has(step)) continue;
            dependencies.logger.info('Startup step', { step });
            try {
              await dependencies.steps?.[step]?.();
            } catch (cause) {
              dependencies.logger.error('Startup gagal', {
                step,
                errorType: cause instanceof Error ? cause.name : typeof cause,
                errorMessage: cause instanceof Error ? cause.message : String(cause),
                errorCode: typeof cause === 'object' && cause !== null && 'code' in cause ? String((cause as { code: unknown }).code) : undefined,
                reason: typeof cause === 'object' && cause !== null && 'reason' in cause ? String((cause as { reason: unknown }).reason) : undefined,
              });
              throw cause;
            }
            if (step === 'openDatabase' && process.env.NODE_ENV === 'production' && !dependencies.isConfigured?.()) {
              return {
                status: 'recovery-required' as const,
                error: createAppError('INVALID_CONFIGURATION', 'Runtime production belum dikonfigurasi.', { recoverable: false }),
              };
            }
            completedSteps.add(step);
          }

          completedSteps.add('ready');
          return { status: 'ready' as const, onboardingCompleted: await dependencies.metadata.getOnboardingCompleted() };
        } catch (cause) {
          return {
            status: 'recovery-required' as const,
            error: createAppError('STARTUP_FAILED', 'Startup gagal dan memerlukan pemulihan.', { recoverable: true, cause }),
          };
        }
      })();

      const current = inFlight;
      void current.finally(() => {
        if (inFlight === current) inFlight = null;
      });
      return current;
    },
  };
}
