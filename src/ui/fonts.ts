import { Gloock_400Regular } from '@expo-google-fonts/gloock/400Regular';
import { Lexend_400Regular } from '@expo-google-fonts/lexend/400Regular';
import { Lexend_500Medium } from '@expo-google-fonts/lexend/500Medium';
import { Lexend_600SemiBold } from '@expo-google-fonts/lexend/600SemiBold';
import { PublicSans_400Regular } from '@expo-google-fonts/public-sans/400Regular';
import { PublicSans_500Medium } from '@expo-google-fonts/public-sans/500Medium';
import { PublicSans_600SemiBold } from '@expo-google-fonts/public-sans/600SemiBold';
import { PublicSans_700Bold } from '@expo-google-fonts/public-sans/700Bold';

/**
 * Font files are bundled at build time by Metro. No Google Fonts request is
 * made at runtime, which keeps onboarding fully offline.
 */
export const fontAssets = {
  Gloock_400Regular,
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  PublicSans_700Bold
} as const;
