import path from 'node:path';

import { buildPackage } from './buildPackage';

// Kunci privat Ed25519 deterministik khusus untuk build pengujian lokal (--dev).
// Pasangan kunci publiknya terdaftar resmi di src/domain/package/trustedKeys.ts ('clata-dev-key').
const DEV_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIEjn6tg2w85T98IIFy0E2SVEls9G/WfxsY2ywD3l2rTO
-----END PRIVATE KEY-----
`;

const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const isDev = process.argv.includes('--dev');

const sourceDir = path.resolve(args[0] ?? 'content/packages/jawa-mataraman/source');
const outputFile = path.resolve(args[1] ?? 'artifacts/packages/jawa-mataraman.clata');

let privateKeyPem = process.env.CLATA_PACKAGE_PRIVATE_KEY;
let keyId = process.env.CLATA_PACKAGE_KEY_ID;

if (!privateKeyPem && isDev) {
  privateKeyPem = DEV_PRIVATE_KEY_PEM;
  keyId = keyId ?? 'clata-dev-key';
  console.info(`[DEV] Menggunakan kunci Ed25519 dev resmi Clata (keyId: ${keyId})`);
}

if (!privateKeyPem) {
  console.error('CLATA_PACKAGE_PRIVATE_KEY is required and must never be committed.');
  console.error('Gunakan flag --dev untuk pengujian lokal (misal: npm run content:build:dev).');
  process.exitCode = 1;
} else {
  void buildPackage({
    sourceDir,
    outputFile,
    privateKeyPem,
    keyId: keyId ?? 'clata-release',
    publicRelease: process.env.CLATA_BUILD_CHANNEL === 'release',
  })
    .then((result) => {
      console.info('Berhasil membuat berkas paket:');
      console.info(JSON.stringify(result, null, 2));
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
