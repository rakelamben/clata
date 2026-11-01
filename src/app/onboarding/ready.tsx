import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function ReadyScreen() {
  const handleStart = () => {
    router.replace('/(tabs)/kata');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.centerSection}>
          <View style={styles.successBadge}>
            <Icon color={colors.surface} name="checkbox-circle-fill" size={56} />
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            Semua Sudah Siap!
          </Text>

          <Text style={styles.description}>
            Paket bahasa daerah pilihanmu telah tersimpan dan siap dipelajari kapan pun tanpa
            koneksi internet.
          </Text>
        </View>

        <View style={styles.actionSection}>
          <AppPressable
            accessibilityLabel="Mulai belajar bahasa daerah"
            accessibilityRole="button"
            onPress={handleStart}
          >
            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Mulai Belajar</Text>
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
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.navy,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
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
