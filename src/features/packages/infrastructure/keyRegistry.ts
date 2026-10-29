import type { PackagePublicKey } from '../domain/packageTypes';

// Public development fixture key only. Production keys must be injected from the
// release key registry and private keys must never be shipped in the app.
export const bundledPublicKeys: PackagePublicKey[] = [
  {
    keyId: 'clata-poc-2026-v2',
    state: 'active',
    publicKey: Uint8Array.from([1, 41, 118, 23, 6, 234, 104, 211, 81, 154, 49, 128, 85, 85, 203, 102, 35, 23, 221, 174, 164, 194, 89, 201, 35, 234, 108, 54, 190, 66, 170, 74]),
  },
];
