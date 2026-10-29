import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export async function checksumFile(filePath: string) {
  const data = await readFile(filePath);
  return { sizeBytes: data.byteLength, sha256: createHash('sha256').update(data).digest('hex') };
}

export function checksum(data: Uint8Array) {
  return createHash('sha256').update(data).digest('hex');
}
