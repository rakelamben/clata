import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { validateContent } from './validateContent';

async function main() {
  const sourceDir = path.resolve(process.argv[2] ?? 'content/packages/jawa-mataraman/source');
  const readJson = async (name: string) => JSON.parse(await readFile(path.join(sourceDir, name), 'utf8').then((value) => value.replace(/^\uFEFF/, '')));
  const result = validateContent({
    units: await readJson('unit.json'), words: await readJson('kata.json'), sentences: await readJson('kalimat.json'),
    dialogues: await readJson('dialog.json'), challenges: await readJson('challenge.json'), publicRelease: false,
  });

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else console.info(JSON.stringify({ ok: true, sourceDir }));
}

void main();
