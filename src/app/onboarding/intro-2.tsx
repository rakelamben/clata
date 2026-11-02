import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function Intro2Screen() {
  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    router.push('/onboarding/select-package');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppPressable
            accessibilityLabel="Kembali ke halaman sebelumnya"
            accessibilityRole="button"
            onPress={handleBack}
            style={styles.backButton}
          >
            <Icon color={colors.navy} name="arrow-left-line" size={24} />
          </AppPressable>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Langkah 2 dari 2</Text>
          </View>
        </View>

        <View style={styles.centerSection}>
          <Text accessibilityRole="header" style={styles.title}>
            Bebas Kuota, Suara Asli, dan Mandiri
          </Text>

          <View style={styles.pillarList}>
            <View style={styles.pillarItem}>
              <View style={[styles.pillarIconBox, { backgroundColor: colors.magentaTint }]}>
                <Icon color={colors.primary} name="volume-up-line" size={24} />
              </View>
              <View style={styles.pillarContent}>
                <Text style={styles.pillarTitle}>Audio Penutur Asli</Text>
                <Text style={styles.pillarDescription}>Rekaman suara penutur asli</Text>
              </View>
            </View>

            <View style={styles.pillarItem}>
              <View style={[styles.pillarIconBox, { backgroundColor: colors.navyTint }]}>
                <Icon color={colors.navy} name="chat-smile-2-line" size={24} />
              </View>
              <View style={styles.pillarContent}>
                <Text style={styles.pillarTitle}>Skenario Percakapan Nyata</Text>
                <Text style={styles.pillarDescription}>Dialog interaktif interaksi sehari-hari</Text>
              </View>
            </View>

            <View style={styles.pillarItem}>
              <View style={[styles.pillarIconBox, { backgroundColor: colors.tealTint }]}>
                <Icon color={colors.teal} name="shield-keyhole-line" size={24} />
              </View>
              <View style={styles.pillarContent}>
                <Text style={styles.pillarTitle}>100% Offline &amp; Privat</Text>
                <Text style={styles.pillarDescription}>
                  Semua data tersimpan di ponselmu tanpa koneksi internet
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <AppPressable
            accessibilityLabel="Mulai dan lanjut memilih paket bahasa"
            accessibilityRole="button"
            onPress={handleNext}
          >
            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Mulai &amp; Unggah Paket Bahasa</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  backButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.navy,
  },
  pillarList: {
    gap: spacing.lg,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillarIconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarContent: {
    flex: 1,
    gap: 2,
  },
  pillarTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.navy,
  },
  pillarDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
