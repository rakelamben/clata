import { describe, expect, it } from 'vitest';

import { bundledPackageSource } from '../../../src/features/packages/infrastructure/bundledPackageSource';
import { bundledPublicKeys } from '../../../src/features/packages/infrastructure/keyRegistry';
import { ed25519SignatureVerifier } from '../../../src/features/packages/infrastructure/signatureVerifier';
import { validatePackageEntries } from '../../../src/features/packages/infrastructure/packageValidator';

describe('bundled Jawa-Mataraman package', () => {
  it('passes archive, checksum, and Ed25519 verification', async () => {
    const entries = await bundledPackageSource.read();
    const result = await validatePackageEntries(entries, {
      appVersion: '1.0.0',
      supportedSchemaVersion: 1,
      languageId: 'jv',
      dialectId: 'mataraman',
      publicKeys: bundledPublicKeys,
      signatureVerifier: ed25519SignatureVerifier,
    });

    if (!result.ok) throw new Error(result.reason);
    expect(result).toMatchObject({ ok: true, identity: { packageId: 'jawa-mataraman', packageVersion: '1.0.0' } });
  });
});
