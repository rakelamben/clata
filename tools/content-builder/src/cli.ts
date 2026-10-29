import path from 'node:path';

import { buildPackage } from './buildPackage';

const sourceDir = path.resolve(process.argv[2] ?? 'content/packages/jawa-mataraman/source');
const outputFile = path.resolve(process.argv[3] ?? 'artifacts/packages/jawa-mataraman.clata');
const privateKeyPem = process.env.CLATA_PACKAGE_PRIVATE_KEY;

if (!privateKeyPem) {
  console.error('CLATA_PACKAGE_PRIVATE_KEY is required and must never be committed.');
  process.exitCode = 1;
} else {
  void buildPackage({ sourceDir, outputFile, privateKeyPem, keyId: process.env.CLATA_PACKAGE_KEY_ID ?? 'clata-release', publicRelease: process.env.CLATA_BUILD_CHANNEL === 'release' })
    .then((result) => console.info(JSON.stringify(result)))
    .catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
