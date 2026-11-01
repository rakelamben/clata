import { Gloock_400Regular } from '@expo-google-fonts/gloock/400Regular';
import { PublicSans_400Regular } from '@expo-google-fonts/public-sans/400Regular';
import { PublicSans_500Medium } from '@expo-google-fonts/public-sans/500Medium';
import { PublicSans_600SemiBold } from '@expo-google-fonts/public-sans/600SemiBold';
import { PublicSans_700Bold } from '@expo-google-fonts/public-sans/700Bold';

/**
 * Font files are bundled at build time by Metro. No Google Fonts request is
 * made at runtime, which keeps onboarding and app usage fully offline.
 */
export const fontAssets = {
  Gloock_400Regular,
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} as const;
