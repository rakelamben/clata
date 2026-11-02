import { router } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { useApp } from '../../context/AppContext';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function ReadyScreen() {
  const { activePackageData, completeOnboarding } = useApp();

  // Blokir penuh tombol kembali dan gesture hardware di layar kesiapan
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Cegah kembali ke proses preparing
    });

    return () => subscription.remove();
  }, []);

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/kata');
  };

  const manifest = activePackageData?.manifest;
  const wordCount = activePackageData?.words.length ?? 0;
  const sentenceCount = activePackageData?.sentences.length ?? 0;
  const dialogueCount = activePackageData?.dialogues.length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.centerSection}>
          <View style={styles.successBadge}>
            <Icon color={colors.surface} name="checkbox-circle-fill" size={56} />
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            Paket Bahasa Siap!
          </Text>

          <Text style={styles.description}>
            Materi pembelajaran dan rekaman suara penutur asli telah terpasang di penyimpanan
            internal ponselmu.
          </Text>

          <View style={styles.identityCard}>
            <Text style={styles.packageTitle}>
              {manifest?.packageId ? manifest.packageId.toUpperCase() : 'PAKET BAHASA'}
            </Text>

            <Text style={styles.dialectText}>
              {manifest?.dialectId ? `Dialek: ${manifest.dialectId}` : 'Dialek Daerah'}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statChipText}>{wordCount} Kata</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statChipText}>{sentenceCount} Kalimat</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statChipText}>{dialogueCount} Dialog</Text>
              </View>
            </View>

            <View style={styles.storageIndicator}>
              <Icon color={colors.teal} name="hard-drive-2-line" size={16} />
              <Text style={styles.storageText}>Tersimpan di SQLite &amp; Internal Storage</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <AppPressable
            accessibilityLabel="Mulai belajar bahasa daerah sekarang"
            accessibilityRole="button"
            onPress={() => void handleStart()}
          >
            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Mulai Belajar Sekarang</Text>
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
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.navy,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  identityCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  packageTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.navy,
  },
  dialectText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statChip: {
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.control,
  },
  statChipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
  },
  storageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  storageText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.teal,
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
