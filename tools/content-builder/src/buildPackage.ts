import { createPrivateKey, sign } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { unzipSync } from 'fflate';

import { canonicalBytes } from './canonicalize';
import { checksum, checksumFile } from './checksum';

type BuildOptions = { sourceDir: string; outputFile: string; privateKeyPem: string; keyId: string; publicRelease?: boolean };

async function filesIn(directory: string, prefix = ''): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await filesIn(path.join(directory, entry.name), relative));
    else if (!['manifest.json', 'tanda-tangan', 'tanda-tangan.json'].includes(entry.name)) result.push(relative);
  }
  return result.sort((left, right) => {
    const a = Buffer.from(left); const b = Buffer.from(right);
    return a.compare(b);
  });
}

export async function buildPackage({ sourceDir, outputFile, privateKeyPem, keyId, publicRelease = false }: BuildOptions) {
  const sourceManifest = JSON.parse(await readFile(path.join(sourceDir, 'manifest.json'), 'utf8')) as Record<string, unknown>;
  const { validateContent } = await import('./validateContent');
  const readJson = async (name: string) => JSON.parse(await readFile(path.join(sourceDir, name), 'utf8').then((value) => value.replace(/^\uFEFF/, '')));
  const contentResult = validateContent({
    units: await readJson('unit.json'), words: await readJson('kata.json'), sentences: await readJson('kalimat.json'),
    dialogues: await readJson('dialog.json'), challenges: await readJson('challenge.json'), publicRelease,
  });
  if (!contentResult.ok) throw new Error(`Content validation failed: ${JSON.stringify(contentResult.issues)}`);
  const filePaths = await filesIn(sourceDir);
  const files = await Promise.all(filePaths.map(async (relativePath) => ({ path: relativePath, ...(await checksumFile(path.join(sourceDir, relativePath))) })));
  const manifest = { ...sourceManifest, files, keyId, signatureReference: 'tanda-tangan' } as unknown as { packageVersion: string; files: typeof files; [key: string]: unknown };
  const signature = sign(null, canonicalBytes({ manifest, files }), createPrivateKey(privateKeyPem)).toString('base64url');

  await mkdir(path.dirname(outputFile), { recursive: true });
  const staging = `${outputFile}.staging`;
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  await cp(sourceDir, staging, { recursive: true });
  await rm(path.join(staging, 'tanda-tangan.json'), { force: true });
  await rm(path.join(staging, 'tanda-tangan'), { force: true });
  await writeFile(path.join(staging, 'manifest.json'), JSON.stringify(manifest));
  await writeFile(path.join(staging, 'tanda-tangan'), JSON.stringify({ algorithm: 'Ed25519', keyId, encoding: 'base64url', signature }));

  const archiveEntries = await Promise.all([...filePaths, 'manifest.json', 'tanda-tangan'].sort().map(async (relativePath) => ({
    relativePath,
    data: await readFile(path.join(staging, relativePath)),
  })));

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputFile);
    const archive = new archiver.ZipArchive({ zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    for (const { relativePath, data } of archiveEntries) archive.append(data, { name: relativePath, date: new Date(0), mode: 0o644 });
    void archive.finalize();
  });
  const finalArchive = await readFile(outputFile);
  if (finalArchive.byteLength > 10 * 1024 * 1024) throw new Error('Archive exceeds the P0 compressed size limit.');
  const extracted = unzipSync(finalArchive);
  const expectedEntries = new Set([...filePaths, 'manifest.json', 'tanda-tangan']);
  const actualEntries = Object.keys(extracted);
  if (actualEntries.length !== expectedEntries.size || actualEntries.some((entry) => !expectedEntries.has(entry))) {
    throw new Error('Final archive entries do not match the manifest source.');
  }
  const finalManifest = JSON.parse(new TextDecoder().decode(extracted['manifest.json'])) as { files: { path: string; sizeBytes: number; sha256: string }[] };
  for (const file of finalManifest.files) {
    const data = extracted[file.path];
    if (!data || data.byteLength !== file.sizeBytes || checksum(data) !== file.sha256) {
      throw new Error(`Final archive checksum mismatch: ${file.path}`);
    }
  }
  await rm(staging, { recursive: true, force: true });
  return { outputFile, packageVersion: manifest.packageVersion, sizeBytes: (await stat(outputFile)).size };
}
