import canonicalize from 'canonicalize';
import { sha256 as sha256Digest } from '@noble/hashes/sha2.js';
import { toByteArray } from 'base64-js';

import { PACKAGE_LIMITS } from './packageLimits';
import { comparePackagePath, normalizePackagePath } from './pathNormalization';
import type { SignatureVerifier } from './signatureVerifier';
import type { PackageArchiveEntry, PackageFile, PackageManifest, PackagePublicKey, PackageRejectReason, PackageValidationResult } from '../domain/packageTypes';
import { comparePackageVersion, parsePackageVersion } from '../domain/packageVersion';

type ValidatorOptions = {
  appVersion: string;
  supportedSchemaVersion: number;
  languageId: string;
  dialectId: string;
  publicKeys: PackagePublicKey[];
  signatureVerifier: SignatureVerifier;
  publicRelease?: boolean;
  archiveSizeBytes?: number;
};

function sha256(data: Uint8Array) {
  return Array.from(sha256Digest(data)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return toByteArray(normalized).slice(0);
}

function parseManifest(data: Uint8Array): PackageManifest | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(data)) as PackageManifest;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.files)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function reasonForManifest(manifest: PackageManifest, options: ValidatorOptions): PackageRejectReason | null {
  const required = ['packageId', 'languageId', 'dialectId', 'packageVersion', 'schemaVersion', 'minimumAppVersion', 'registerMapping', 'orthographyReference', 'createdAt', 'itemCounts', 'keyId', 'signatureReference'];
  if (required.some((key) => manifest[key as keyof PackageManifest] === undefined)) return 'INVALID_MANIFEST';
  try { parsePackageVersion(manifest.packageVersion); } catch { return 'INVALID_VERSION'; }
  if (manifest.schemaVersion !== options.supportedSchemaVersion) return 'UNSUPPORTED_SCHEMA';
  try {
    if (comparePackageVersion(manifest.minimumAppVersion, options.appVersion) > 0) return 'APP_VERSION_TOO_LOW';
  } catch { return 'INVALID_VERSION'; }
  if (manifest.languageId !== options.languageId) return 'UNSUPPORTED_LANGUAGE';
  if (manifest.dialectId !== options.dialectId) return 'UNSUPPORTED_DIALECT';
  return null;
}

function validateContentEntries(normalized: Map<string, Uint8Array>, options: ValidatorOptions): PackageRejectReason | null {
  const parseArray = (name: string) => {
    const data = normalized.get(name);
    if (!data || data.byteLength > PACKAGE_LIMITS.maxJsonBytes) return null;
    try {
      const value = JSON.parse(new TextDecoder().decode(data));
    return Array.isArray(value) ? value as Record<string, unknown>[] : null;
    } catch { return null; }
  };
  const units = parseArray('unit.json');
  const words = parseArray('kata.json');
  const sentences = parseArray('kalimat.json');
  const dialogues = parseArray('dialog.json');
  const challenges = parseArray('challenge.json');
  if (!units || !words || !sentences || !dialogues || !challenges) return 'INVALID_CONTENT';
  if (words.length < 4) return 'INVALID_CONTENT';

  const wordIds = new Set<string>();
  for (const word of words) {
    if (typeof word.id !== 'string' || typeof word.text !== 'string' || typeof word.meaning !== 'string' || typeof word.register !== 'string') return 'INVALID_CONTENT';
    wordIds.add(word.id);
  }

  const ids = new Set<string>();
  for (const item of [...words, ...sentences, ...dialogues, ...challenges]) {
    if (typeof item.id !== 'string' || ids.has(item.id)) return 'INVALID_CONTENT';
    ids.add(item.id);
    if (options.publicRelease && item.status === 'poc') return 'UNVERIFIED_PUBLIC_CONTENT';
  }
  for (const sentence of sentences) {
    if (typeof sentence.text !== 'string' || (sentence.text.match(/___/g) ?? []).length !== 1 || typeof sentence.gap !== 'string' || !wordIds.has(sentence.gap)) return 'INVALID_CONTENT';
    if (!Array.isArray(sentence.word_ids) || !sentence.word_ids.every((id) => typeof id === 'string' && wordIds.has(id)) || !sentence.word_ids.includes(sentence.gap)) return 'INVALID_REFERENCE';
  }
  for (const dialogue of dialogues) {
    const nodes = Array.isArray(dialogue.nodes) ? dialogue.nodes as Record<string, unknown>[] : [];
    if (nodes.length < 6 || nodes.length > 10) return 'INVALID_DIALOG_GRAPH';
    const nodeIds = new Set(nodes.map((node) => node.id).filter((id): id is string => typeof id === 'string'));
    if (nodeIds.size !== nodes.length) return 'INVALID_DIALOG_GRAPH';
    for (const node of nodes) {
      if (typeof node.audio !== 'string' || !normalized.has(node.audio)) return 'INVALID_REFERENCE';
      const choices = Array.isArray(node.choices) ? node.choices as Record<string, unknown>[] : [];
      for (const choice of choices) if (typeof choice.next === 'string' && !nodeIds.has(choice.next) && choice.next !== 'end') return 'INVALID_DIALOG_GRAPH';
    }
  }
  for (const challenge of challenges) if (typeof challenge.unit_id !== 'string' || !units.some((unit) => unit.unit_id === challenge.unit_id)) return 'INVALID_REFERENCE';
  return null;
}

export async function validatePackageEntries(entries: PackageArchiveEntry[], options: ValidatorOptions): Promise<PackageValidationResult> {
  const normalized = new Map<string, Uint8Array>();
  let totalBytes = 0;
  const archiveSize = options.archiveSizeBytes ?? entries.reduce((total, entry) => total + entry.data.byteLength, 0);
  if (archiveSize > PACKAGE_LIMITS.maxArchiveBytes) return { ok: false, reason: 'ARCHIVE_TOO_LARGE' };
  if (entries.length > PACKAGE_LIMITS.maxEntries) return { ok: false, reason: 'TOO_MANY_ENTRIES' };

  for (const entry of entries) {
    const normalizedPath = normalizePackagePath(entry.path);
    if (!normalizedPath.ok) return normalizedPath;
    if (normalized.has(normalizedPath.path)) return { ok: false, reason: 'DUPLICATE_PATH' };
    if (entry.data.byteLength > PACKAGE_LIMITS.maxFileBytes) return { ok: false, reason: 'FILE_TOO_LARGE' };
    totalBytes += entry.data.byteLength;
    if (totalBytes > PACKAGE_LIMITS.maxUncompressedBytes) return { ok: false, reason: 'TOTAL_UNCOMPRESSED_TOO_LARGE' };
    normalized.set(normalizedPath.path, entry.data);
  }

  const manifestData = normalized.get('manifest.json');
  const signatureData = normalized.get('tanda-tangan');
  if (!manifestData || !signatureData || manifestData.byteLength > PACKAGE_LIMITS.maxJsonBytes) return { ok: false, reason: 'INVALID_MANIFEST' };
  const manifest = parseManifest(manifestData);
  if (!manifest) return { ok: false, reason: 'INVALID_MANIFEST' };
  const manifestReason = reasonForManifest(manifest, options);
  if (manifestReason) return { ok: false, reason: manifestReason };

  const files: PackageFile[] = [...normalized.entries()]
    .filter(([path]) => path !== 'manifest.json' && path !== 'tanda-tangan')
    .map(([path, data]) => ({ path, sizeBytes: data.byteLength, sha256: sha256(data) }))
    .sort((left, right) => comparePackagePath(left.path, right.path));

  if (JSON.stringify(files) !== JSON.stringify(manifest.files)) return { ok: false, reason: 'CHECKSUM_MISMATCH' };
  const key = options.publicKeys.find((candidate) => candidate.keyId === manifest.keyId);
  if (!key) return { ok: false, reason: 'UNKNOWN_KEY' };
  if (key.state === 'revoked') return { ok: false, reason: 'REVOKED_KEY' };

  let signature: { algorithm: string; keyId: string; encoding: string; signature: string };
  try {
    const parsed = JSON.parse(new TextDecoder().decode(signatureData));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'INVALID_SIGNATURE' };
    signature = parsed as typeof signature;
  } catch { return { ok: false, reason: 'INVALID_SIGNATURE' }; }
  if (signature.algorithm !== 'Ed25519' || signature.keyId !== manifest.keyId || signature.encoding !== 'base64url' || typeof signature.signature !== 'string' || !signature.signature) return { ok: false, reason: 'INVALID_SIGNATURE' };
  const canonical = canonicalize({ manifest, files });
  if (!canonical) return { ok: false, reason: 'NON_CANONICAL_SIGNATURE' };
  let valid = false;
  try {
    valid = await options.signatureVerifier.verify(new TextEncoder().encode(canonical), decodeBase64Url(signature.signature), key);
  } catch {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }
  if (!valid) return { ok: false, reason: 'INVALID_SIGNATURE' };

  const contentReason = validateContentEntries(normalized, options);
  if (contentReason) return { ok: false, reason: contentReason };

  return { ok: true, identity: { packageId: manifest.packageId, languageId: manifest.languageId, dialectId: manifest.dialectId, packageVersion: manifest.packageVersion, schemaVersion: manifest.schemaVersion }, fileCount: files.length, totalBytes };
}
