import { describe, expect, it } from 'vitest';

import { bundledPublicKeys } from '../../../src/features/packages/infrastructure/keyRegistry';
import { ed25519SignatureVerifier } from '../../../src/features/packages/infrastructure/signatureVerifier';
import { bundledPackageSource } from '../../../src/features/packages/infrastructure/bundledPackageSource';
import { validatePackageEntries } from '../../../src/features/packages/infrastructure/packageValidator';

describe('package signature contract', () => {
  it('accepts the signed bundled fixture with the active public key', async () => {
    const result = await validatePackageEntries(await bundledPackageSource.read(), {
      appVersion: '1.0.0', supportedSchemaVersion: 1, languageId: 'jv', dialectId: 'mataraman',
      publicKeys: bundledPublicKeys, signatureVerifier: ed25519SignatureVerifier,
    });
    expect(result.ok).toBe(true);
  });
});
