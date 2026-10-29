export function clampStrength(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function initialStrength(): number {
  return 0.1;
}

export function updateStrength(oldStrength: number, result: number, weight: number): number {
  return clampStrength(oldStrength + 0.3 * weight * (result - oldStrength));
}
