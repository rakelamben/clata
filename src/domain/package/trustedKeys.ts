import type { PackagePublicKey } from './packageTypes';

// Bundled development & fixture public keys.
// Production keys are injected via secure release configs.
export const bundledPublicKeys: PackagePublicKey[] = [
  {
    keyId: 'clata-poc-2026-v2',
    state: 'active',
    publicKey: Uint8Array.from([
      1, 41, 118, 23, 6, 234, 104, 211, 81, 154, 49, 128, 85, 85, 203, 102,
      35, 23, 221, 174, 164, 194, 89, 201, 35, 234, 108, 54, 190, 66, 170, 74,
    ]),
  },
  {
    keyId: 'clata-dev-key',
    state: 'active',
    publicKey: Uint8Array.from([
      94, 134, 218, 160, 159, 146, 215, 98, 243, 69, 216, 167, 60, 226, 112, 246,
      15, 179, 194, 98, 210, 252, 31, 116, 133, 240, 165, 168, 75, 122, 35, 192,
    ]),
  },
];

export function findPublicKey(
  keyId: string,
  customKeys?: PackagePublicKey[],
): PackagePublicKey | null {
  const registry = customKeys ?? bundledPublicKeys;
  return registry.find((k) => k.keyId === keyId) ?? null;
}
