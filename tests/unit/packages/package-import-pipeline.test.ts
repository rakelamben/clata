import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import canonicalize from 'canonicalize';
import { describe, expect, it } from 'vitest';
import { zipSync } from 'fflate';

import {
  InMemoryPackageStorageAdapter,
  installPackageFromBuffer,
} from '../../../src/domain/package/atomicPackageInstaller';
import type { PackagePublicKey } from '../../../src/domain/package/packageTypes';

function loadFixtureFiles(sourceDir: string): Record<string, Uint8Array> {
  const result: Record<string, Uint8Array> = {};

  function scan(current: string, prefix = '') {
    for (const name of readdirSync(current)) {
      const full = path.join(current, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      if (statSync(full).isDirectory()) {
        scan(full, rel);
      } else {
        result[rel] = new Uint8Array(readFileSync(full));
      }
    }
  }

  scan(sourceDir);
  return result;
}

describe('Package Import Pipeline (Client-Side FR-85)', () => {
  const fixtureDir = path.resolve('content/packages/jawa-mataraman/source');
  const fixtureFiles = loadFixtureFiles(fixtureDir);

  // Kunci Ed25519 deterministik khusus untuk lingkungan pengujian otomatis
  const { publicKey: testCryptoPubKey, privateKey: testCryptoPrivKey } = generateKeyPairSync('ed25519');
  const testRawPubKey = testCryptoPubKey.export({ type: 'spki', format: 'der' }).subarray(-32);
  const testKeyId = 'test-ed25519-key';
  const testKeys: PackagePublicKey[] = [
    {
      keyId: testKeyId,
      state: 'active',
      publicKey: testRawPubKey,
    },
  ];

  function createSignedArchive(
    baseFiles: Record<string, Uint8Array>,
    customSignerKey = testCryptoPrivKey,
    keyId = testKeyId,
  ): Uint8Array {
    const files = { ...baseFiles };
    const manifest = JSON.parse(new TextDecoder().decode(files['manifest.json']));
    manifest.keyId = keyId;

    const canonical = canonicalize({ manifest, files: manifest.files });
    if (!canonical) throw new Error('Failed to canonicalize test payload');

    const signature = sign(null, Buffer.from(canonical, 'utf8'), customSignerKey).toString('base64url');

    files['manifest.json'] = new TextEncoder().encode(JSON.stringify(manifest));
    files['tanda-tangan'] = new TextEncoder().encode(
      JSON.stringify({
        algorithm: 'Ed25519',
        keyId,
        encoding: 'base64url',
        signature,
      }),
    );

    return zipSync(files, { level: 9 });
  }

  it('successfully installs and activates a valid official .clata package', async () => {
    const archiveBuffer = createSignedArchive(fixtureFiles);
    const storage = new InMemoryPackageStorageAdapter();

    const result = await installPackageFromBuffer(archiveBuffer, {
      storage,
      customKeys: testKeys,
    });

    expect(result.ok).toBe(true);
    expect(result.packageId).toBe('jawa-mataraman');
    expect(result.packageVersion).toBe('2.0.0');
    expect(result.extractedFilesCount).toBe(8);
    expect(result.bundleArchivePath).toBe('packages/installed/jawa-mataraman/bundle.clata');
    expect(result.loadedPackage?.units.length).toBe(1);
    expect(result.loadedPackage?.words.length).toBe(30);
    expect(result.loadedPackage?.sentences.length).toBe(12);
    expect(result.loadedPackage?.dialogues.length).toBe(6);
    expect(result.loadedPackage?.challenges.length).toBe(5);

    // Verifikasi bahwa salinan arsip .clata tersimpan di storage
    const savedBundle = await storage.getBundleArchive('jawa-mataraman');
    expect(savedBundle).not.toBeNull();
    expect(savedBundle?.byteLength).toBe(archiveBuffer.byteLength);

    // Verifikasi berkas terurai dapat diakses
    const manifestBytes = await storage.getFile('jawa-mataraman', 'manifest.json');
    expect(manifestBytes).not.toBeNull();
  });

  it('rejects an archive with tampered signature', async () => {
    // Decode zip, ubah signature
    const corruptedFiles = { ...fixtureFiles };
    corruptedFiles['tanda-tangan'] = new TextEncoder().encode(
      JSON.stringify({
        algorithm: 'Ed25519',
        keyId: testKeyId,
        encoding: 'base64url',
        signature: 'invalid_base64_signature_here_padded_0000000000000000000000000000000000000000000000000000000000',
      }),
    );

    const badArchive = zipSync(corruptedFiles);
    const result = await installPackageFromBuffer(badArchive, { customKeys: testKeys });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('INVALID_SIGNATURE');
  });

  it('rejects an archive when a content file has been tampered without manifest update (checksum mismatch)', async () => {
    const tamperedFiles = { ...fixtureFiles };
    // Tambahkan 1 spasi ke kata.json tanpa memperbarui sha256 di manifest
    tamperedFiles['kata.json'] = new TextEncoder().encode(
      new TextDecoder().decode(tamperedFiles['kata.json']) + ' ',
    );

    // Manifest masih mereferensikan hash lama, tapi signed
    const archiveBuffer = createSignedArchive(tamperedFiles);
    const result = await installPackageFromBuffer(archiveBuffer, { customKeys: testKeys });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('CHECKSUM_MISMATCH');
  });

  it('rejects an archive that is corrupted or not a valid zip', async () => {
    const corruptedBuffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
    const result = await installPackageFromBuffer(corruptedBuffer, { customKeys: testKeys });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('ARCHIVE_CORRUPTED');
  });

  it('strictly rejects archives contaminated with user progress or personal data files', async () => {
    const contaminatedFiles = {
      ...fixtureFiles,
      'user_progress.json': new TextEncoder().encode(JSON.stringify({ streak: 5, score: 100 })),
    };

    const archiveBuffer = zipSync(contaminatedFiles);
    const result = await installPackageFromBuffer(archiveBuffer, { customKeys: testKeys });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('FORBIDDEN_DATA_CONTAMINATION');
    expect(result.message).toContain('data progres atau data personal');
  });

  it('rejects archives with zip-slip directory traversal paths', async () => {
    const unsafeFiles = {
      ...fixtureFiles,
      '../evil.json': new TextEncoder().encode('{}'),
    };

    const archiveBuffer = zipSync(unsafeFiles);
    const result = await installPackageFromBuffer(archiveBuffer, { customKeys: testKeys });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('INVALID_PATH');
  });

  it('rejects packages signed by a revoked key', async () => {
    const archiveBuffer = createSignedArchive(fixtureFiles);
    const revokedKeys: PackagePublicKey[] = [
      {
        keyId: testKeyId,
        state: 'revoked',
        publicKey: testRawPubKey,
      },
    ];

    const result = await installPackageFromBuffer(archiveBuffer, { customKeys: revokedKeys });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('INVALID_SIGNATURE');
    expect(result.message).toContain('dicabut (revoked)');
  });

  it('rolls back staging cleanly if activation fails', async () => {
    const failingStorage = new InMemoryPackageStorageAdapter();
    // Simulasikan kegagalan saat aktivasi atomik
    failingStorage.activate = async () => {
      throw new Error('Simulated disk failure during activation');
    };

    const archiveBuffer = createSignedArchive(fixtureFiles);
    const result = await installPackageFromBuffer(archiveBuffer, {
      storage: failingStorage,
      customKeys: testKeys,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('ARCHIVE_CORRUPTED');
    expect(await failingStorage.hasPackage('jawa-mataraman')).toBe(false);
    expect(await failingStorage.getBundleArchive('jawa-mataraman')).toBeNull();
  });
});
