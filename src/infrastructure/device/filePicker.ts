import * as DocumentPicker from 'expo-document-picker';

export interface PickedPackageFile {
  name: string;
  sizeBytes: number;
  buffer: Uint8Array;
}

export async function pickLocalPackageFile(): Promise<PickedPackageFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
      '*/*',
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const name = asset.name ?? 'package.clata';
  const sizeBytes = asset.size ?? 0;

  // Baca buffer biner berkas via fetch (didukung oleh React Native & Web untuk file:// / blob://)
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  return {
    name,
    sizeBytes: buffer.byteLength || sizeBytes,
    buffer,
  };
}
