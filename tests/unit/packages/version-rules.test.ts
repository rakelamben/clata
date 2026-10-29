import { describe, expect, it } from 'vitest';

import { comparePackageVersion, parsePackageVersion } from '../../../src/features/packages/domain/packageVersion';

describe('package versions', () => {
  it('compares SemVer numerically', () => {
    expect(comparePackageVersion('1.10.0', '1.9.0')).toBe(1);
    expect(comparePackageVersion('1.0.0', '1.0.0')).toBe(0);
    expect(comparePackageVersion('0.9.0', '1.0.0')).toBe(-1);
  });

  it('rejects non-SemVer values', () => {
    expect(() => parsePackageVersion('1.0')).toThrow();
  });
});
