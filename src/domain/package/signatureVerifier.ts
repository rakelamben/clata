import canonicalize from 'canonicalize';
import { hashes, verify } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { toByteArray } from 'base64-js';

import type { PackageFileEntry, PackageManifest, PackagePublicKey } from './packageTypes';
import { findPublicKey } from './trustedKeys';

hashes.sha512 = sha512;

export interface SignatureContainer {
  algorithm: string;
  keyId: string;
  encoding: string;
  signature: string;
}

export function decodeBase64(value: string): Uint8Array {
  // Normalize base64url to standard base64 and pad
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  return toByteArray(normalized);
}

export async function verifyPackageSignature(params: {
  manifest: PackageManifest;
  files: PackageFileEntry[];
  signatureContainer: SignatureContainer;
  customKeys?: PackagePublicKey[];
}): Promise<{ ok: boolean; reason?: string }> {
  const { manifest, files, signatureContainer, customKeys } = params;

  if (signatureContainer.algorithm !== 'Ed25519') {
    return { ok: false, reason: `Algoritma tanda tangan tidak didukung: ${signatureContainer.algorithm}` };
  }

  const keyId = signatureContainer.keyId ?? manifest.keyId;
  if (!keyId) {
    return { ok: false, reason: 'keyId tidak ditemukan pada tanda tangan atau manifest' };
  }

  const publicKeyEntry = findPublicKey(keyId, customKeys);
  if (!publicKeyEntry) {
    return { ok: false, reason: `Kunci publik "${keyId}" tidak terdaftar atau tidak dipercaya` };
  }

  if (publicKeyEntry.state === 'revoked') {
    return { ok: false, reason: `Kunci publik "${keyId}" telah dicabut (revoked)` };
  }

  const canonical = canonicalize({ manifest, files });
  if (!canonical) {
    return { ok: false, reason: 'Gagal melakukan kanonikalisasi JCS terhadap payload manifest' };
  }

  const payloadBytes = new TextEncoder().encode(canonical);
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = decodeBase64(signatureContainer.signature);
  } catch {
    return { ok: false, reason: 'Format tanda tangan bukan base64 / base64url yang valid' };
  }

  if (signatureBytes.byteLength !== 64) {
    return { ok: false, reason: `Panjang byte tanda tangan Ed25519 tidak valid (${signatureBytes.byteLength} bytes, diharapkan 64)` };
  }

  if (publicKeyEntry.publicKey.byteLength !== 32) {
    return { ok: false, reason: `Panjang byte kunci publik Ed25519 tidak valid (${publicKeyEntry.publicKey.byteLength} bytes, diharapkan 32)` };
  }

  try {
    const isValid = await verify(signatureBytes, payloadBytes, publicKeyEntry.publicKey);
    if (!isValid) {
      return { ok: false, reason: 'Tanda tangan digital Ed25519 tidak cocok dengan payload berkas manifest' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `Kesalahan saat memverifikasi tanda tangan: ${String(err)}` };
  }
}
