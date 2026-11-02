import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '../../context/AppContext';
import { colors, fonts, radii, spacing } from '../../ui/theme';

export default function SplashScreen() {
  const { isInitialized, isOnboardingCompleted, activePackageId } = useApp();

  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      if (isOnboardingCompleted && activePackageId) {
        router.replace('/(tabs)/kata');
      } else {
        router.replace('/onboarding/intro-1');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isInitialized, isOnboardingCompleted, activePackageId]);

  const handleManualProceed = () => {
    if (!isInitialized) return;
    if (isOnboardingCompleted && activePackageId) {
      router.replace('/(tabs)/kata');
    } else {
      router.replace('/onboarding/intro-1');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        accessibilityLabel="Memuat status aplikasi Clata"
        accessibilityRole="button"
        onPress={handleManualProceed}
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
    lineHeight: 56,
  },
  brandTitle: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  brandTagline: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  footer: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
