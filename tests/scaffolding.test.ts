import { describe, expect, it } from 'vitest';

import { colors, fonts } from '../src/ui/theme';

describe('project scaffolding', () => {
  it('exposes design system tokens and fonts', () => {
    expect(colors.primary).toBeDefined();
    expect(fonts.display).toBe('Gloock_400Regular');
    expect(fonts.body).toBe('PublicSans_400Regular');
    expect(fonts.ui).toBe('PublicSans_400Regular');
    expect(fonts.uiSemiBold).toBe('PublicSans_600SemiBold');
  });
});
