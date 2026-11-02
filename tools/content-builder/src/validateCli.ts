import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { validateContent } from './validateContent';

async function listAudioFiles(dir: string): Promise<string[]> {
  try {
    const s = await stat(dir);
    if (!s.isDirectory()) return [];
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => `audio/${e.name}`);
  } catch {
    return [];
  }
}

async function main() {
  const sourceDir = path.resolve(process.argv[2] ?? 'content/packages/jawa-mataraman/source');
  const readJson = async (name: string) =>
    JSON.parse(await readFile(path.join(sourceDir, name), 'utf8').then((value) => value.replace(/^\uFEFF/, '')));

  const audioFiles = await listAudioFiles(path.join(sourceDir, 'audio'));

  const result = validateContent({
    units: await readJson('unit.json'),
    words: await readJson('kata.json'),
    sentences: await readJson('kalimat.json'),
    dialogues: await readJson('dialog.json'),
    challenges: await readJson('challenge.json'),
    publicRelease: false,
    availableAudioFiles: audioFiles.length > 0 ? audioFiles : undefined,
  });

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else {
    console.info(JSON.stringify({ ok: true, sourceDir, verifiedAudioFiles: audioFiles.length }));
  }
}

void main();
