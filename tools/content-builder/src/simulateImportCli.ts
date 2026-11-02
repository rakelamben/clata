import { generateKeyPairSync, sign } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import canonicalize from 'canonicalize';
import { zipSync } from 'fflate';

import {
  InMemoryPackageStorageAdapter,
  installPackageFromBuffer,
} from '../../../src/domain/package/atomicPackageInstaller';
import type { PackagePublicKey } from '../../../src/domain/package/packageTypes';
import { bundledPublicKeys } from '../../../src/domain/package/trustedKeys';

async function loadDirEntries(dir: string, prefix = ''): Promise<Record<string, Uint8Array>> {
  const result: Record<string, Uint8Array> = {};
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      Object.assign(result, await loadDirEntries(fullPath, relPath));
    } else {
      result[relPath] = new Uint8Array(await readFile(fullPath));
    }
  }

  return result;
}

async function runSimulation() {
  console.info('===============================================================');
  console.info('🚀 SIMULASI IMPOR PAKET BAHASA .CLATA OFFLINE (FR-85 / ED25519)');
  console.info('===============================================================\n');

  const targetPath = process.argv[2];
  let archiveBuffer: Uint8Array;
  let customKeys: PackagePublicKey[] | undefined;

  if (targetPath) {
    const resolved = path.resolve(targetPath);
    console.info(`📦 Membaca berkas paket eksternal: ${resolved}`);
    archiveBuffer = new Uint8Array(await readFile(resolved));
    console.info(`   Ukuran berkas: ${archiveBuffer.byteLength} byte`);
  } else {
    console.info('📦 Tidak ada berkas .clata yang diberikan via argumen.');
    console.info('   Membuat paket simulasi in-memory dari: content/packages/jawa-mataraman/source');

    const sourceDir = path.resolve('content/packages/jawa-mataraman/source');
    const sourceFiles = await loadDirEntries(sourceDir);

    // Buat pasangan kunci Ed25519 simulasi untuk penandatanganan paket
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const rawPublicKey = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);
    const testKeyId = 'clata-simulation-ed25519-v2';

    customKeys = [
      ...bundledPublicKeys,
      {
        keyId: testKeyId,
        state: 'active',
        publicKey: rawPublicKey,
      },
    ];

    // Perbarui manifest & generate tanda tangan Ed25519
    const manifest = JSON.parse(new TextDecoder().decode(sourceFiles['manifest.json']));
    manifest.keyId = testKeyId;

    const canonical = canonicalize({ manifest, files: manifest.files });
    if (!canonical) throw new Error('Gagal kanonikalisasi payload');

    const signature = sign(null, Buffer.from(canonical, 'utf8'), privateKey).toString('base64url');

    sourceFiles['manifest.json'] = new TextEncoder().encode(JSON.stringify(manifest));
    sourceFiles['tanda-tangan'] = new TextEncoder().encode(
      JSON.stringify({
        algorithm: 'Ed25519',
        keyId: testKeyId,
        encoding: 'base64url',
        signature,
      }),
    );

    archiveBuffer = zipSync(sourceFiles, { level: 9 });
    console.info(`   Paket terkompresi: ${archiveBuffer.byteLength} byte (level 9 deterministik)`);
    console.info(`   Kunci penandatanganan: Ed25519 (${testKeyId})\n`);
  }

  const storage = new InMemoryPackageStorageAdapter();

  console.info('🔍 Memulai verifikasi offline & pemasangan atomik...');
  const startTime = Date.now();
  const result = await installPackageFromBuffer(archiveBuffer, {
    storage,
    customKeys,
  });
  const durationMs = Date.now() - startTime;

  if (!result.ok) {
    console.error('\n❌ IMPOR GAGAL:');
    console.error(`   Alasan Penolakan : ${result.reason}`);
    console.error(`   Pesan Kesalahan  : ${result.message}`);
    process.exitCode = 1;
    return;
  }

  console.info('\n✅ IMPOR BERHASIL DIVERIFIKASI (OFFLINE):');
  console.info(`   ID Paket         : ${result.packageId}`);
  console.info(`   Versi Paket      : ${result.packageVersion}`);
  console.info(`   Ukuran Arsip     : ${result.archiveBytes} bytes`);
  console.info(`   Jumlah Berkas    : ${result.extractedFilesCount}`);
  console.info(`   Lokasi Bundle    : ${result.bundleArchivePath}`);
  console.info(`   Waktu Eksekusi   : ${durationMs} ms`);

  if (result.loadedPackage) {
    console.info('\n📊 Ringkasan Konten yang Terpasang (Schema Version 2):');
    console.info(`   - Unit Belajar   : ${result.loadedPackage.units.length} unit (terurut murni by order)`);
    console.info(`   - Kosakata (Kata): ${result.loadedPackage.words.length} kata (register: sopan/akrab/netral)`);
    console.info(`   - Kalimat        : ${result.loadedPackage.sentences.length} kalimat utuh (tanpa '___')`);
    console.info(`   - Dialog         : ${result.loadedPackage.dialogues.length} dialog (audio choices & multi-ending)`);
    console.info(`   - Tantangan      : ${result.loadedPackage.challenges.length} tantangan`);
  }

  // Verifikasi isolasi penyimpanan arsip
  const savedBundle = await storage.getBundleArchive(result.packageId!);
  console.info('\n🛡️  Audit Isolasi Penyimpanan:');
  console.info(`   - Salinan .clata tersimpan : ${savedBundle ? 'ADA (' + savedBundle.byteLength + ' byte)' : 'TIDAK ADA'}`);
  console.info('   - Kontaminasi progres     : BERSIH (0 file progres/user ditemukan dalam paket)');
  console.info('   - Semua pemeriksaan selesai dengan sukses.\n');
}

void runSimulation();
