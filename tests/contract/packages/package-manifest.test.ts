import { describe, expect, it } from 'vitest';

import { bundledPackageSource } from '../../../src/features/packages/infrastructure/bundledPackageSource';

describe('package manifest contract', () => {
  it('includes the stable package identity fields', async () => {
    const entries = await bundledPackageSource.read();
    const manifest = JSON.parse(new TextDecoder().decode(entries.find((entry) => entry.path === 'manifest.json')?.data));
    expect(manifest).toMatchObject({ packageId: 'jawa-mataraman', languageId: 'jv', dialectId: 'mataraman', schemaVersion: 1 });
    expect(manifest.files).toBeInstanceOf(Array);
  });
});
