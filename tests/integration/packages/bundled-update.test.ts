import { describe, expect, it } from 'vitest';

import { comparePackageVersion } from '../../../src/features/packages/domain/packageVersion';

describe('bundled update evidence', () => {
  it('recognizes a higher SemVer bundle as an update', () => {
    expect(comparePackageVersion('1.1.0', '1.0.0')).toBe(1);
  });
});
