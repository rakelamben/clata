import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('routing flow files', () => {
  it('contains all required onboarding screens', () => {
    const onboardingFiles = [
      '_layout.tsx',
      'splash.tsx',
      'intro-1.tsx',
      'intro-2.tsx',
      'select-package.tsx',
      'preparing.tsx',
      'ready.tsx',
    ];

    for (const file of onboardingFiles) {
      expect(fs.existsSync(path.join(__dirname, '../src/app/onboarding', file))).toBe(true);
    }
  });

  it('contains bottom tab layout and screens with titles', () => {
    const tabFiles = ['_layout.tsx', 'kata.tsx', 'latihan.tsx', 'tantangan.tsx', 'profil.tsx'];

    for (const file of tabFiles) {
      expect(fs.existsSync(path.join(__dirname, '../src/app/(tabs)', file))).toBe(true);
    }
  });
});
