import type { PackagePublicKey } from '../domain/packageTypes';

// Public development fixture key only. Production keys must be injected from the
// release key registry and private keys must never be shipped in the app.
export const bundledPublicKeys: PackagePublicKey[] = [
  {
    keyId: 'clata-poc-2026-v2',
    state: 'active',
    publicKey: Uint8Array.from([22, 235, 171, 124, 174, 130, 102, 210, 1, 145, 30, 204, 79, 167, 21, 40, 195, 57, 87, 30, 157, 18, 5, 45, 153, 7, 22, 12, 175, 7, 125, 54]),
  },
];
