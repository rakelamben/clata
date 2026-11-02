import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, fonts, radii, spacing } from '../../../ui/theme';

export interface ProfileHeroCardsProps {
  streakDays: number;
  masteryLevelLabel: string;
  masteryProgress: number; // 0 to 1
  onPressStreak: () => void;
  onPressMastery: () => void;
}

export function ProfileHeroCards({
  streakDays,
  masteryLevelLabel,
  masteryProgress,
  onPressStreak,
  onPressMastery,
}: ProfileHeroCardsProps) {
  const clampedProgress = Math.max(0, Math.min(1, masteryProgress));

  return (
    <View style={styles.container}>
      {/* 1. Card Kiri: Hari Streak (1:1) */}
      <Pressable
        accessibilityLabel={`Streak belajar: ${streakDays} hari. Ketuk untuk rincian.`}
        accessibilityRole="button"
        onPress={onPressStreak}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.iconCircleOrange}>
          <Icon color={colors.primary} name="fire-fill" size={24} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.streakNumberRow}>
            <Text style={styles.streakNumber}>{streakDays}</Text>
            <Text style={styles.streakUnit}>Hari</Text>
          </View>
          <Text style={styles.cardLabel}>Hari Streak</Text>
        </View>
      </Pressable>

      {/* 2. Card Kanan: Level Mastery (1:1) */}
      <Pressable
        accessibilityLabel={`Tingkat penguasaan: ${masteryLevelLabel}. Ketuk untuk rincian.`}
        accessibilityRole="button"
        onPress={onPressMastery}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.iconCircleTeal}>
          <Icon color={colors.teal} name="award-fill" size={24} />
        </View>

        <View style={styles.cardContent}>
          <Text numberOfLines={1} style={styles.masteryLevelText}>
            {masteryLevelLabel}
          </Text>

          {/* Mini Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(clampedProgress * 100)}%` },
              ]}
            />
          </View>

          <Text style={styles.cardLabel}>Tingkat Penguasaan</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#F8F9FA',
    transform: [{ scale: 0.98 }],
  },
  iconCircleOrange: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orangeTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleTeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tealTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    gap: 4,
  },
  streakNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakNumber: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.navy,
    lineHeight: 32,
  },
  streakUnit: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.primary,
  },
  masteryLevelText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.navy,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.navyTint,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 3,
  },
  cardLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
