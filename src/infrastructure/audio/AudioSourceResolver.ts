export interface AudioSourceResolver {
  resolve(packageId: string, packageVersion: string, path: string): string | number | null;
}
