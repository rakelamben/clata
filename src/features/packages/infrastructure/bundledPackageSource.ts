import type { BundledPackageSource } from '../application/verifyBundledPackage';
import type { PackageArchiveEntry } from '../domain/packageTypes';

const textEncoder = new TextEncoder();
const manifest = require('../../../../content/packages/jawa-mataraman/source/manifest.json') as Record<string, unknown>;
const signature = require('../../../../content/packages/jawa-mataraman/source/tanda-tangan.json') as Record<string, unknown>;

const content = {
  'unit.json': require('../../../../content/packages/jawa-mataraman/source/unit.json'),
  'kata.json': require('../../../../content/packages/jawa-mataraman/source/kata.json'),
  'kalimat.json': require('../../../../content/packages/jawa-mataraman/source/kalimat.json'),
  'dialog.json': require('../../../../content/packages/jawa-mataraman/source/dialog.json'),
  'challenge.json': require('../../../../content/packages/jawa-mataraman/source/challenge.json'),
};

export const bundledPackageSource: BundledPackageSource = {
  async read(): Promise<PackageArchiveEntry[]> {
    return [
      { path: 'manifest.json', data: textEncoder.encode(JSON.stringify(manifest)) },
      ...Object.entries(content).map(([path, value]) => ({ path, data: textEncoder.encode(JSON.stringify(value)) })),
      // Audio bytes are replaced by the final verified media asset during the
      // release build; the fixture remains deliberately marked `poc`.
      ...['audio/dialog-start.opus', 'audio/kalimat-sugeng.opus', 'audio/kata-sugeng.opus'].map((path) => ({ path, data: Uint8Array.from([79, 112, 117, 115]) })),
      { path: 'tanda-tangan', data: textEncoder.encode(JSON.stringify(signature)) },
    ];
  },
};
