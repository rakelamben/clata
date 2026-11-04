import { loadPackageData } from './packageLoader';
import type {
  LoadedPackage,
  PackageInstallResult,
  PackagePublicKey,
} from './packageTypes';
import { extractAndValidateArchive } from './packageArchiveExtractor';
import { verifyPackageSignature } from './signatureVerifier';
import { validateContent } from './contentValidator';

export interface InstalledPackageRecord {
  packageId: string;
  languageId: string;
  dialectId: string;
  packageVersion: string;
  schemaVersion: number;
  installedAt: string;
  archiveSizeBytes: number;
  bundleArchivePath: string;
}

export interface PackageStorageAdapter {
  hasPackage(packageId: string): Promise<boolean>;
  stage(packageId: string, archiveBytes: Uint8Array, files: Map<string, Uint8Array>): Promise<void>;
  activate(packageId: string): Promise<void>;
  discardStaging(packageId: string): Promise<void>;
  getInstalledRecord(packageId: string): Promise<InstalledPackageRecord | null>;
  getBundleArchive(packageId: string): Promise<Uint8Array | null>;
  getFile(packageId: string, relativePath: string): Promise<Uint8Array | null>;
}

export class InMemoryPackageStorageAdapter implements PackageStorageAdapter {
  private activeRecords = new Map<string, InstalledPackageRecord>();
  private activeFiles = new Map<string, Map<string, Uint8Array>>();
  private activeBundles = new Map<string, Uint8Array>();

  private stagedRecords = new Map<string, InstalledPackageRecord>();
  private stagedFiles = new Map<string, Map<string, Uint8Array>>();
  private stagedBundles = new Map<string, Uint8Array>();

  async hasPackage(packageId: string): Promise<boolean> {
    return this.activeRecords.has(packageId);
  }

  async stage(packageId: string, archiveBytes: Uint8Array, files: Map<string, Uint8Array>): Promise<void> {
    const manifestRaw = files.get('manifest.json');
    if (!manifestRaw) throw new Error('Missing manifest.json during staging');
    const manifest = JSON.parse(new TextDecoder().decode(manifestRaw));

    this.stagedRecords.set(packageId, {
      packageId,
      languageId: manifest.languageId,
      dialectId: manifest.dialectId,
      packageVersion: manifest.packageVersion,
      schemaVersion: manifest.schemaVersion,
      installedAt: new Date().toISOString(),
      archiveSizeBytes: archiveBytes.byteLength,
      bundleArchivePath: `packages/installed/${packageId}/bundle.clata`,
    });
    this.stagedBundles.set(packageId, archiveBytes.slice());
    this.stagedFiles.set(packageId, new Map(files));
  }

  async activate(packageId: string): Promise<void> {
    const record = this.stagedRecords.get(packageId);
    const bundle = this.stagedBundles.get(packageId);
    const files = this.stagedFiles.get(packageId);

    if (!record || !bundle || !files) {
      throw new Error(`Tidak ada staging aktif untuk paket: ${packageId}`);
    }

    this.activeRecords.set(packageId, record);
    this.activeBundles.set(packageId, bundle);
    this.activeFiles.set(packageId, files);

    this.stagedRecords.delete(packageId);
    this.stagedBundles.delete(packageId);
    this.stagedFiles.delete(packageId);
  }

  async discardStaging(packageId: string): Promise<void> {
    this.stagedRecords.delete(packageId);
    this.stagedBundles.delete(packageId);
    this.stagedFiles.delete(packageId);
  }

  async getInstalledRecord(packageId: string): Promise<InstalledPackageRecord | null> {
    return this.activeRecords.get(packageId) ?? null;
  }

  async getBundleArchive(packageId: string): Promise<Uint8Array | null> {
    return this.activeBundles.get(packageId) ?? null;
  }

  async getFile(packageId: string, relativePath: string): Promise<Uint8Array | null> {
    const files = this.activeFiles.get(packageId);
    return files?.get(relativePath) ?? null;
  }
}

export type InstallProgressStep =
  | 'READING_ARCHIVE'
  | 'EXTRACTING_FILES'
  | 'VERIFYING_CHECKSUMS'
  | 'VERIFYING_SIGNATURE'
  | 'VALIDATING_CONTENT'
  | 'SAVING_STORAGE'
  | 'COMPLETED';

export type InstallProgressCallback = (
  step: InstallProgressStep,
  percent: number,
  statusText: string,
) => void;

export interface InstallPackageOptions {
  storage?: PackageStorageAdapter;
  customKeys?: PackagePublicKey[];
  publicRelease?: boolean;
  onProgress?: InstallProgressCallback;
}

export async function installPackageFromBuffer(
  archiveBuffer: Uint8Array,
  options: InstallPackageOptions = {},
): Promise<PackageInstallResult & { loadedPackage?: LoadedPackage }> {
  const storage = options.storage ?? new InMemoryPackageStorageAdapter();
  const reportProgress = (step: InstallProgressStep, percent: number, text: string) => {
    if (options.onProgress) {
      try {
        options.onProgress(step, percent, text);
      } catch {
        // Abaikan error pada listener UI
      }
    }
  };

  reportProgress('READING_ARCHIVE', 10, 'Membuka berkas arsip .clata...');

  // 1. Ekstraksi arsip dan verifikasi checksum per berkas & batas keamanan
  reportProgress('EXTRACTING_FILES', 30, 'Mengekstrak aset audio & kosakata daerah...');
  const extractResult = extractAndValidateArchive(archiveBuffer);
  if (!extractResult.ok) {
    return {
      ok: false,
      reason: extractResult.reason,
      message: extractResult.message,
    };
  }

  const { manifest, signatureContainer, files, fileEntries } = extractResult.extracted;
  reportProgress('VERIFYING_CHECKSUMS', 55, 'Memverifikasi hash SHA-256 per berkas...');

  // 2. Verifikasi tanda tangan digital Ed25519 kanonikal JCS
  reportProgress('VERIFYING_SIGNATURE', 75, 'Memverifikasi tanda tangan digital Ed25519...');
  const sigVerify = await verifyPackageSignature({
    manifest,
    files: manifest.files,
    signatureContainer,
    customKeys: options.customKeys,
  });

  if (!sigVerify.ok) {
    return {
      ok: false,
      reason: 'INVALID_SIGNATURE',
      message: sigVerify.reason ?? 'Tanda tangan paket tidak valid',
      packageId: manifest.packageId,
      packageVersion: manifest.packageVersion,
    };
  }

  // 3. Dekode file JSON konten untuk validasi data & aturan bisnis
  reportProgress('VALIDATING_CONTENT', 90, 'Memvalidasi kalimat kanonikal & skenario dialog...');
  const readJson = (name: string): unknown[] => {
    const data = files.get(name);
    if (!data) throw new Error(`Berkas konten wajib "${name}" tidak ditemukan`);
    return JSON.parse(new TextDecoder().decode(data)) as unknown[];
  };

  let loaded: LoadedPackage;
  try {
    loaded = loadPackageData({
      manifest,
      units: readJson('unit.json'),
      words: readJson('kata.json'),
      sentences: readJson('kalimat.json'),
      dialogues: readJson('dialog.json'),
      challenges: readJson('challenge.json'),
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'INVALID_CONTENT',
      message: `Kegagalan validasi skema data: ${String(err)}`,
      packageId: manifest.packageId,
      packageVersion: manifest.packageVersion,
    };
  }

  // 4. Jalankan validasi konten mendalam (integritas relasi unit_id, graf dialog, audio)
  const availableAudio = Array.from(files.keys()).filter((p) => p.startsWith('audio/'));
  const contentValidation = validateContent({
    units: loaded.units as unknown as Record<string, unknown>[],
    words: loaded.words as unknown as Record<string, unknown>[],
    sentences: loaded.sentences as unknown as Record<string, unknown>[],
    dialogues: loaded.dialogues as unknown as Record<string, unknown>[],
    challenges: loaded.challenges as unknown as Record<string, unknown>[],
    publicRelease: options.publicRelease ?? false,
    availableAudioFiles: availableAudio,
  });

  if (!contentValidation.ok) {
    return {
      ok: false,
      reason: 'INVALID_CONTENT',
      message: `Konten paket tidak memenuhi validasi: ${JSON.stringify(contentValidation.issues)}`,
      packageId: manifest.packageId,
      packageVersion: manifest.packageVersion,
    };
  }

  // 5. Pemasangan Atomik: Stage -> Simpan Salinan Berkas .clata -> Aktifkan
  const packageId = manifest.packageId;
  reportProgress('SAVING_STORAGE', 95, 'Menyimpan paket ke basis data lokal perangkat...');
  try {
    await storage.stage(packageId, archiveBuffer, files);
    await storage.activate(packageId);

    reportProgress('COMPLETED', 100, 'Pemasangan paket selesai!');
    const record = await storage.getInstalledRecord(packageId);
    return {
      ok: true,
      packageId: manifest.packageId,
      packageVersion: manifest.packageVersion,
      archiveBytes: archiveBuffer.byteLength,
      extractedFilesCount: fileEntries.length,
      installedPath: `packages/installed/${packageId}`,
      bundleArchivePath: record?.bundleArchivePath ?? `packages/installed/${packageId}/bundle.clata`,
      loadedPackage: loaded,
    };
  } catch (err) {
    await storage.discardStaging(packageId);
    return {
      ok: false,
      reason: 'ARCHIVE_CORRUPTED',
      message: `Gagal menyelesaikan aktivasi paket: ${String(err)}`,
      packageId,
    };
  }
}
