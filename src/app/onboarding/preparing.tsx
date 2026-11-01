import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

const PREPARATION_STEPS = [
  'Mengunduh materi bahasa pilihan…',
  'Mengekstrak aset audio & kosakata lokal…',
  'Menyiapkan ruang belajar offline…',
  'Pemasangan paket selesai!',
] as const;

export default function PreparingScreen() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((current) => {
        if (current < PREPARATION_STEPS.length - 1) {
          return current + 1;
        }
        clearInterval(interval);
        return current;
      });
    }, 800);

    const autoNavigate = setTimeout(() => {
      router.replace('/onboarding/ready');
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(autoNavigate);
    };
  }, []);

  const handleManualProceed = () => {
    router.replace('/onboarding/ready');
  };

  const isCompleted = stepIndex === PREPARATION_STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.centerSection}>
          <View style={styles.indicatorContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            Menyiapkan Paket Bahasa
          </Text>

          <Text accessibilityLiveRegion="polite" style={styles.statusText}>
            {PREPARATION_STEPS[stepIndex]}
          </Text>
        </View>

        <View style={styles.actionSection}>
          {isCompleted ? (
            <AppPressable
              accessibilityLabel="Lanjut ke ringkasan kesiapan"
              accessibilityRole="button"
              onPress={handleManualProceed}
            >
              <View style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Lanjut</Text>
              </View>
            </AppPressable>
          ) : (
            <Text style={styles.hintText}>Mohon tunggu sebentar…</Text>
          )}
        </View>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  indicatorContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.navy,
    textAlign: 'center',
  },
  statusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
    textAlign: 'center',
  },
  actionSection: {
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  primaryButton: {
    width: '100%',
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
