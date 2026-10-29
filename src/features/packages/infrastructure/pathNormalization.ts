import type { PackageRejectReason } from '../domain/packageTypes';

export function normalizePackagePath(input: string): { ok: true; path: string } | { ok: false; reason: PackageRejectReason } {
  const path = input.replaceAll('\\', '/');
  if (!path || path.startsWith('/') || /^[A-Za-z]:\//.test(path)) return { ok: false, reason: 'UNSAFE_PATH' };
  const segments = path.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return { ok: false, reason: 'UNSAFE_PATH' };
  if (segments.length > 8) return { ok: false, reason: 'PATH_TOO_DEEP' };
  return { ok: true, path: segments.join('/') };
}

export function comparePackagePath(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.min(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    if (leftBytes[index] !== rightBytes[index]) return leftBytes[index] - rightBytes[index];
  }
  return leftBytes.length - rightBytes.length;
}
