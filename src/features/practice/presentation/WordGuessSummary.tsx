import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import type { WordGuessSessionStats } from '../domain/wordGuessEngine';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export interface WordGuessSummaryProps {
  stats: WordGuessSessionStats;
  onReturnToUnit: () => void;
}

export function WordGuessSummary({
  stats,
  onReturnToUnit,
}: WordGuessSummaryProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.contentContainer}>
        {/* 1. Icon Selesai */}
        <View style={styles.trophyCircle}>
          <Icon color={colors.primary} name="trophy-fill" size={48} />
        </View>

        {/* 2. Teks "Latihan selesai" */}
        <Text style={styles.titleText}>Latihan selesai</Text>
        <Text style={styles.subtitleText}>
          Hebat! Kamu telah menuntaskan seluruh kosakata sesi tebak kata ini.
        </Text>

        {/* 3. Cards Total Benar & Total Salah */}
        <View style={styles.cardsRow}>
          {/* Card Total Benar */}
          <View style={[styles.statCard, { borderColor: colors.teal }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.tealTint }]}>
              <Icon color={colors.teal} name="checkbox-circle-fill" size={24} />
            </View>
            <Text style={[styles.statNumberText, { color: colors.teal }]}>
              {stats.firstAttemptCorrect}
            </Text>
            <Text style={styles.statLabelText}>Jawaban Benar</Text>
          </View>

          {/* Card Total Salah / Perlu Revisi */}
          <View style={[styles.statCard, { borderColor: colors.border }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.orangeTint }]}>
              <Icon color={colors.primary} name="refresh-line" size={24} />
            </View>
            <Text style={[styles.statNumberText, { color: colors.primary }]}>
              {stats.firstAttemptWrong}
            </Text>
            <Text style={styles.statLabelText}>Perlu Revisi</Text>
          </View>
        </View>
      </View>

      {/* 4. Di Bagian Bawah: Tombol Kembali ke unit */}
      <View style={styles.bottomBar}>
        <AppPressable
          accessibilityLabel="Kembali ke layar unit latihan"
          accessibilityRole="button"
          onPress={onReturnToUnit}
          style={styles.returnButton}
        >
          <Text style={styles.returnButtonText}>Kembali ke unit</Text>
        </AppPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.orangeTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  titleText: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.navy,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
    maxWidth: 280,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumberText: {
    fontFamily: fonts.uiBold,
    fontSize: 28,
    lineHeight: 34,
  },
  statLabelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  returnButton: {
    height: touchTarget + 4,
    backgroundColor: colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
