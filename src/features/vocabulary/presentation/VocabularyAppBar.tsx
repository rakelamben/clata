import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, spacing, touchTarget } from '../../../ui/theme';

interface VocabularyAppBarProps {
  scrollCount: number;
  isStreakCompleted: boolean;
  onOpenDictionary: () => void;
}

export function VocabularyAppBar({
  scrollCount,
  isStreakCompleted,
  onOpenDictionary,
}: VocabularyAppBarProps) {
  // Progres bar 0 hingga 10 (maksimal 100%)
  const progressPercent = Math.min(100, Math.max(0, (scrollCount / 10) * 100));

  return (
    <View style={styles.headerRow}>
      {/* 1. Sisi Kiri: Spacer Penyeimbang Simetri */}
      <View style={styles.spacer} />

      {/* 2. Tengah: Indikator Streak Harian */}
      <View style={styles.centerSection}>
        {isStreakCompleted ? (
          <View style={styles.completedPill}>
            <Icon color={colors.primary} name="fire-fill" size={16} />
            <Text style={styles.completedPillText}>Streak menyala</Text>
          </View>
        ) : (
          <View
            accessibilityLabel={`Kemajuan streak harian: ${scrollCount} dari 10 kata`}
            style={styles.progressCapsule}
          >
            <Icon color={colors.primary} name="fire-line" size={16} />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        )}
      </View>

      {/* 3. Sisi Kanan: Tombol Kamus Ikon-Saja */}
      <AppPressable
        accessibilityLabel="Buka Kamus Kosakata"
        accessibilityRole="button"
        onPress={onOpenDictionary}
        style={styles.dictionaryButton}
      >
        <Icon color={colors.navy} name="book-open-line" size={20} />
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  spacer: {
    width: touchTarget,
    height: touchTarget,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressTrack: {
    width: 90,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.orangeTint,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
  },
  completedPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.navy,
  },
  dictionaryButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
