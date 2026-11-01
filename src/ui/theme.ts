export const colors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#4A4A4A',
  border: '#D9D9D9',
  borderStrong: '#6B6B6B',
  primary: '#AD3603',
  primaryPressed: '#0A2E44',
  navy: '#0A2E44',
  magenta: '#960238',
  teal: '#166868',
  warning: '#8A5200',
  focus: '#0A2E44',
  scrim: 'rgba(17, 17, 17, 0.72)',
  navyTint: '#EAF0F3',
  tealTint: '#E7F2F2',
  magentaTint: '#F8E7ED',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radii = { control: 10, card: 12, sheet: 16 } as const;
export const motion = { fast: 120, standard: 200, emphasis: 280, slow: 360 } as const;

/**
 * Local, bundled font families. These names are registered by `useFonts` in
 * AppProviders, so screens never depend on a runtime network request.
 * Use the family that carries the weight instead of `fontWeight`, because
 * Android does not synthesise weights for bundled fonts reliably.
 */
export const fonts = {
  display: 'Gloock_400Regular',
  body: 'PublicSans_400Regular',
  bodyMedium: 'PublicSans_500Medium',
  bodySemiBold: 'PublicSans_600SemiBold',
  bodyBold: 'PublicSans_700Bold',
  ui: 'Lexend_400Regular',
  uiMedium: 'Lexend_500Medium',
  uiSemiBold: 'Lexend_600SemiBold',
} as const;

/** Minimum touch target: 44 pt iOS / 48 dp Android. 48 covers both. */
export const touchTarget = 48;
