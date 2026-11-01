import { unzipSync } from 'fflate';
import { sha256 } from '@noble/hashes/sha2.js';

import type { PackageFileEntry, PackageManifest, PackageRejectReason } from './packageTypes';
import type { SignatureContainer } from './signatureVerifier';

export const PACKAGE_LIMITS = {
  maxArchiveBytes: 10 * 1024 * 1024, // 10MB
  maxEntries: 1000,
  maxUncompressedBytes: 30 * 1024 * 1024, // 30MB
  maxFileBytes: 5 * 1024 * 1024, // 5MB
  maxPathDepth: 8,
} as const;

// Daftar pola berkas terlarang untuk menjamin isolasi total data pengguna/personal dari paket bahasa
const FORBIDDEN_FILE_PATTERNS = [
  /progress/i,
  /history/i,
  /streak/i,
  /score/i,
  /user/i,
  /account/i,
  /personal/i,
  /\.db$/i,
  /\.sqlite/i,
];

export interface ExtractedArchive {
  manifest: PackageManifest;
  signatureContainer: SignatureContainer;
  files: Map<string, Uint8Array>;
  fileEntries: PackageFileEntry[];
  totalUncompressedBytes: number;
}

export function computeSha256Hex(data: Uint8Array): string {
  const hash = sha256(data);
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizePackageFilePath(rawPath: string): { ok: true; path: string } | { ok: false; reason: PackageRejectReason; message: string } {
  const normalized = rawPath.replace(/\\/g, '/');

  if (!normalized || normalized.startsWith('/') || /^[a-zA-Z]:\//.test(normalized)) {
    return { ok: false, reason: 'INVALID_PATH', message: `Path file tidak aman atau berupa path absolut: ${rawPath}` };
  }

  const segments = normalized.split('/');
  if (segments.some((seg) => !seg || seg === '.' || seg === '..')) {
    return { ok: false, reason: 'INVALID_PATH', message: `Path file memuat traversal terlarang (. atau ..): ${rawPath}` };
  }

  if (segments.length > PACKAGE_LIMITS.maxPathDepth) {
    return { ok: false, reason: 'INVALID_PATH', message: `Kedalaman direktori melebihi batas (${segments.length} > ${PACKAGE_LIMITS.maxPathDepth}): ${rawPath}` };
  }

  // Cek kontaminasi data personal
  const fileName = segments[segments.length - 1];
  for (const pattern of FORBIDDEN_FILE_PATTERNS) {
    if (pattern.test(fileName)) {
      return {
        ok: false,
        reason: 'FORBIDDEN_DATA_CONTAMINATION',
        message: `Paket bahasa terlarang memuat data progres atau data personal pengguna: ${rawPath}`,
      };
    }
  }

  return { ok: true, path: segments.join('/') };
}

export function extractAndValidateArchive(archiveBuffer: Uint8Array): {
  ok: true;
  extracted: ExtractedArchive;
} | {
  ok: false;
  reason: PackageRejectReason;
  message: string;
} {
  if (archiveBuffer.byteLength > PACKAGE_LIMITS.maxArchiveBytes) {
    return {
      ok: false,
      reason: 'ARCHIVE_TOO_LARGE',
      message: `Ukuran arsip (${archiveBuffer.byteLength} byte) melebihi batas maksimum (${PACKAGE_LIMITS.maxArchiveBytes} byte).`,
    };
  }

  let unzippedEntries: Record<string, Uint8Array>;
  try {
    unzippedEntries = unzipSync(archiveBuffer);
  } catch (err) {
    return {
      ok: false,
      reason: 'ARCHIVE_CORRUPTED',
      message: `Gagal mengekstrak arsip zip / .clata: ${String(err)}`,
    };
  }

  const entryKeys = Object.keys(unzippedEntries);
  if (entryKeys.length > PACKAGE_LIMITS.maxEntries) {
    return {
      ok: false,
      reason: 'TOO_MANY_ENTRIES',
      message: `Jumlah entri dalam arsip (${entryKeys.length}) melebihi batas maksimum (${PACKAGE_LIMITS.maxEntries}).`,
    };
  }

  const normalizedFiles = new Map<string, Uint8Array>();
  let totalUncompressed = 0;

  for (const rawKey of entryKeys) {
    // Abaikan entri direktori murni
    if (rawKey.endsWith('/')) continue;

    const norm = normalizePackageFilePath(rawKey);
    if (!norm.ok) {
      return { ok: false, reason: norm.reason, message: norm.message };
    }

    if (normalizedFiles.has(norm.path)) {
      return {
        ok: false,
        reason: 'DUPLICATE_PATH',
        message: `Terdapat entri duplikat pada berkas arsip: ${norm.path}`,
      };
    }

    const data = unzippedEntries[rawKey];
    if (data.byteLength > PACKAGE_LIMITS.maxFileBytes) {
      return {
        ok: false,
        reason: 'FILE_TOO_LARGE',
        message: `Ukuran berkas ${norm.path} (${data.byteLength} byte) melebihi batas maksimum (${PACKAGE_LIMITS.maxFileBytes} byte).`,
      };
    }

    totalUncompressed += data.byteLength;
    if (totalUncompressed > PACKAGE_LIMITS.maxUncompressedBytes) {
      return {
        ok: false,
        reason: 'TOTAL_UNCOMPRESSED_TOO_LARGE',
        message: `Total ukuran berkas terurai (${totalUncompressed} byte) melebihi batas maksimum (${PACKAGE_LIMITS.maxUncompressedBytes} byte).`,
      };
    }

    normalizedFiles.set(norm.path, data);
  }

  const manifestData = normalizedFiles.get('manifest.json');
  if (!manifestData) {
    return {
      ok: false,
      reason: 'INVALID_MANIFEST',
      message: 'Berkas manifest.json tidak ditemukan di dalam paket.',
    };
  }

  let manifest: PackageManifest;
  try {
    manifest = JSON.parse(new TextDecoder().decode(manifestData)) as PackageManifest;
  } catch {
    return {
      ok: false,
      reason: 'INVALID_MANIFEST',
      message: 'Berkas manifest.json rusak atau bukan format JSON valid.',
    };
  }

  const sigData = normalizedFiles.get('tanda-tangan') ?? normalizedFiles.get('tanda-tangan.json');
  if (!sigData) {
    return {
      ok: false,
      reason: 'INVALID_SIGNATURE',
      message: 'Berkas tanda tangan digital ("tanda-tangan") tidak ditemukan di dalam paket.',
    };
  }

  let signatureContainer: SignatureContainer;
  try {
    signatureContainer = JSON.parse(new TextDecoder().decode(sigData)) as SignatureContainer;
  } catch {
    return {
      ok: false,
      reason: 'INVALID_SIGNATURE',
      message: 'Berkas tanda tangan digital tidak berupa JSON valid.',
    };
  }

  // Verifikasi file checksums terhadap manifest.files
  const expectedFiles = manifest.files;
  if (!Array.isArray(expectedFiles)) {
    return {
      ok: false,
      reason: 'INVALID_MANIFEST',
      message: 'manifest.files harus berupa array daftar berkas.',
    };
  }

  // Kumpulkan berkas konten selain berkas kontrol (manifest.json & tanda-tangan)
  const actualFileEntries: PackageFileEntry[] = [];
  for (const [path, data] of normalizedFiles.entries()) {
    if (path === 'manifest.json' || path === 'tanda-tangan' || path === 'tanda-tangan.json') {
      continue;
    }
    const hash = computeSha256Hex(data);
    actualFileEntries.push({
      path,
      sizeBytes: data.byteLength,
      sha256: hash,
    });
  }

  // Urutkan canonical path
  actualFileEntries.sort((a, b) => a.path.localeCompare(b.path));

  // Pastikan setiap berkas yang tertera di manifest cocok dengan fisik berkas
  const expectedMap = new Map<string, PackageFileEntry>();
  for (const file of expectedFiles) {
    expectedMap.set(file.path, file);
  }

  if (actualFileEntries.length !== expectedFiles.length) {
    return {
      ok: false,
      reason: 'CHECKSUM_MISMATCH',
      message: `Jumlah berkas fisik (${actualFileEntries.length}) tidak sesuai dengan daftar di manifest (${expectedFiles.length}).`,
    };
  }

  for (const actual of actualFileEntries) {
    const expected = expectedMap.get(actual.path);
    if (!expected) {
      return {
        ok: false,
        reason: 'CHECKSUM_MISMATCH',
        message: `Berkas tidak terdaftar di manifest: ${actual.path}`,
      };
    }
    if (actual.sizeBytes !== expected.sizeBytes) {
      return {
        ok: false,
        reason: 'CHECKSUM_MISMATCH',
        message: `Ukuran byte berkas "${actual.path}" (${actual.sizeBytes}) tidak cocok dengan manifest (${expected.sizeBytes}).`,
      };
    }
    if (actual.sha256 !== expected.sha256) {
      return {
        ok: false,
        reason: 'CHECKSUM_MISMATCH',
        message: `Checksum SHA-256 berkas "${actual.path}" tidak cocok dengan manifest.`,
      };
    }
  }

  return {
    ok: true,
    extracted: {
      manifest,
      signatureContainer,
      files: normalizedFiles,
      fileEntries: actualFileEntries,
      totalUncompressedBytes: totalUncompressed,
    },
  };
}
