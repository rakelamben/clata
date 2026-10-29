import { useFonts } from 'expo-font';
import type { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fontAssets } from '../ui/fonts';
import { colors, spacing } from '../ui/theme';
import { AppBootstrap } from './AppBootstrap';

export function AppProviders({ children }: PropsWithChildren) {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        accessible
        accessibilityLabel="Menyiapkan Clata"
        accessibilityLiveRegion="polite"
        style={styles.loading}
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan Clata…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppBootstrap>{children}</AppBootstrap>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
