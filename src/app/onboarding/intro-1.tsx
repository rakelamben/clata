import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function Intro1Screen() {
  const handleNext = () => {
    router.push('/onboarding/intro-2');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Langkah 1 dari 2</Text>
          </View>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.iconContainer}>
            <Icon color={colors.primary} name="chat-smile-2-fill" size={48} />
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            Belajar Bahasa Daerah dengan Rasa &amp; Kesantunan
          </Text>

          <Text style={styles.description}>
            Bahasa daerah adalah soal rasa, bahasa yang kamu ucapkan dengan warga lokal adalah kunci
            menciptakan hubungan yang harmonis
          </Text>
        </View>

        <View style={styles.actionSection}>
          <AppPressable
            accessibilityLabel="Lanjut ke halaman pengenalan kedua"
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
  header: {
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
  },
  stepBadge: {
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.control,
  },
  stepBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
    paddingTop: spacing.md,
  },
  primaryButton: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.surface,
  },
});
