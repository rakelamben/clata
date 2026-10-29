import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('architecture boundaries', () => {
  it('keeps domain ports free from framework imports and implementations', () => {
    const files = [
      'src/domain/ports/Clock.ts',
      'src/domain/ports/DeviceIdentity.ts',
      'src/domain/ports/Logger.ts',
    ];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/from ['"](react|expo|react-native|sqlite|supabase)/i);
      expect(source).not.toMatch(/console\.(log|info|warn|error)/);
    }
  });

  it('keeps routes free from direct infrastructure imports', () => {
    const routeSource = readFileSync(resolve('src/app/index.tsx'), 'utf8');

    expect(routeSource).not.toMatch(/src\/infrastructure|\.\.\/infrastructure/);
    expect(routeSource).not.toMatch(/sqlite|supabase|file-system|network/i);
  });
});
