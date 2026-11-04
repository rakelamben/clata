import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import canonicalize from 'canonicalize';
import { describe, expect, it } from 'vitest';
import { zipSync } from 'fflate';

import {
  InMemoryPackageStorageAdapter,
  installPackageFromBuffer,
  type InstallProgressStep,
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

describe('Package Import Progress Reporting', () => {
  const fixtureDir = path.resolve('tests/fixtures/sample-package/source');
  const fixtureFiles = loadFixtureFiles(fixtureDir);

  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const rawPubKey = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);
  const testKeyId = 'progress-test-key';
  const testKeys: PackagePublicKey[] = [
    {
      keyId: testKeyId,
      state: 'active',
      publicKey: rawPubKey,
    },
  ];

  function createSignedArchive(): Uint8Array {
    const files = { ...fixtureFiles };
    const manifest = JSON.parse(new TextDecoder().decode(files['manifest.json']));
    manifest.keyId = testKeyId;

    const canonical = canonicalize({ manifest, files: manifest.files });
    const signature = sign(null, Buffer.from(canonical!, 'utf8'), privateKey).toString('base64url');

    files['manifest.json'] = new TextEncoder().encode(JSON.stringify(manifest));
    files['tanda-tangan'] = new TextEncoder().encode(
      JSON.stringify({
        algorithm: 'Ed25519',
        keyId: testKeyId,
        encoding: 'base64url',
        signature,
      }),
    );

    return zipSync(files, { level: 9 });
  }

  it('triggers onProgress sequentially across all installation phases', async () => {
    const archiveBuffer = createSignedArchive();
    const storage = new InMemoryPackageStorageAdapter();

    const progressReports: { step: InstallProgressStep; percent: number; text: string }[] = [];

    const result = await installPackageFromBuffer(archiveBuffer, {
      storage,
      customKeys: testKeys,
      onProgress: (step, percent, text) => {
        progressReports.push({ step, percent, text });
      },
    });

    expect(result.ok).toBe(true);
    expect(progressReports.length).toBeGreaterThanOrEqual(6);

    const steps = progressReports.map((r) => r.step);
    expect(steps).toContain('READING_ARCHIVE');
    expect(steps).toContain('EXTRACTING_FILES');
    expect(steps).toContain('VERIFYING_CHECKSUMS');
    expect(steps).toContain('VERIFYING_SIGNATURE');
    expect(steps).toContain('VALIDATING_CONTENT');
    expect(steps).toContain('SAVING_STORAGE');
    expect(steps).toContain('COMPLETED');

    // Pastikan persentase naik secara monotonik
    for (let i = 1; i < progressReports.length; i++) {
      expect(progressReports[i].percent).toBeGreaterThanOrEqual(progressReports[i - 1].percent);
    }
    expect(progressReports[progressReports.length - 1].percent).toBe(100);
  });
});
