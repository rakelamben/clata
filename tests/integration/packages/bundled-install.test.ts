import { describe, expect, it } from 'vitest';

import { bundledPackageSource } from '../../../src/features/packages/infrastructure/bundledPackageSource';

describe('bundled install evidence', () => {
  it('provides a complete bundled source entry set', async () => {
    const entries = await bundledPackageSource.read();
    expect(entries.map((entry) => entry.path)).toContain('manifest.json');
    expect(entries.map((entry) => entry.path)).toContain('tanda-tangan');
  });
});
