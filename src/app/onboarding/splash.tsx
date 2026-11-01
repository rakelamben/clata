import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radii, spacing } from '../../ui/theme';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding/intro-1');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    router.replace('/onboarding/intro-1');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        accessibilityLabel="Lanjut ke pengenalan aplikasi"
        accessibilityRole="button"
        onPress={handlePress}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>C</Text>
          </View>

          <Text style={styles.brandTitle}>Clata</Text>
          <Text style={styles.brandTagline}>Celoteh Nusantara</Text>
        </View>

        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: radii.sheet,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoBadgeText: {
    fontFamily: fonts.display,
    fontSize: 52,
    color: colors.surface,
  },
  brandTitle: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
