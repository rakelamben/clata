import type { AudioSourceResolver } from './AudioSourceResolver';

const bundledSources: Record<string, number> = {
  // Metro requires static asset expressions for local binary resources.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'audio/kata-sugeng.opus': require('../../../content/packages/jawa-mataraman/source/audio/kata-sugeng.opus'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'audio/kalimat-sugeng.opus': require('../../../content/packages/jawa-mataraman/source/audio/kalimat-sugeng.opus'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'audio/dialog-start.opus': require('../../../content/packages/jawa-mataraman/source/audio/dialog-start.opus'),
};

export class BundledAudioSourceResolver implements AudioSourceResolver {
  resolve(packageId: string, packageVersion: string, path: string): string | number | null {
    if (packageId !== 'jawa-mataraman' || packageVersion !== '1.0.0') return null;
    return bundledSources[path] ?? null;
  }
}
