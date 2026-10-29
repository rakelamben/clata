import type { PackageManifest, PackagePublicKey } from '../domain/packageTypes';
import { hashes, verify } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

hashes.sha512 = sha512;

export type SignaturePayload = { manifest: PackageManifest; files: PackageManifest['files'] };

export interface SignatureVerifier {
  verify(payload: Uint8Array, signature: Uint8Array, publicKey: PackagePublicKey): Promise<boolean>;
}

export const ed25519SignatureVerifier: SignatureVerifier = {
  verify: async (payload, signature, publicKey) => {
    const normalizedPayload = payload.slice();
    const normalizedSignature = signature.slice();
    const normalizedPublicKey = publicKey.publicKey.slice();
    if (normalizedSignature.byteLength !== 64 || normalizedPublicKey.byteLength !== 32) return false;
    return verify(normalizedSignature, normalizedPayload, normalizedPublicKey);
  },
};
