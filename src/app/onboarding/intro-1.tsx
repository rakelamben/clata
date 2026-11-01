import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function IntroOneScreen() {
  const handleNext = () => {
    router.push('/onboarding/intro-2');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.illustrationSection}>
          <View style={styles.illustrationCard}>
            <View style={styles.iconCircle}>
              <Icon color={colors.primary} name="translate-2" size={48} />
            </View>
          </View>
        </View>

        <View style={styles.textSection}>
          <Text accessibilityRole="header" style={styles.title}>
            Mengenal Budaya Lewat Bahasa
          </Text>
          <Text style={styles.description}>
            Jelajahi keragaman bahasa daerah Nusantara langsung dari genggamanmu secara mudah,
            menyenangkan, dan berakar pada budaya lokal.
          </Text>
        </View>

        <View style={styles.actionSection}>
          <AppPressable
            accessibilityLabel="Lanjut ke pengenalan berikutnya"
            accessibilityRole="button"
            onPress={handleNext}
          >
            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Lanjut</Text>
              <Icon color={colors.surface} name="arrow-right-line" size={20} />
            </View>
          </AppPressable>
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
  illustrationSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationCard: {
    width: 220,
    height: 220,
    borderRadius: radii.sheet * 2,
    backgroundColor: colors.navyTint,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  textSection: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.navy,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  actionSection: {
    paddingBottom: spacing.sm,
  },
  primaryButton: {
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
