import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '../context/AppContext';
import { fontAssets } from '../ui/fonts';
import { colors, spacing } from '../ui/theme';

export default function RootLayout() {
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
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
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
