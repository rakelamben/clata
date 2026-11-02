import { StyleSheet, Text, View } from 'react-native';
import Icon, { type IconName } from 'react-native-remix-icon';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

interface PracticeAppBarProps {
  unitCount: number;
}

export function PracticeAppBar({ unitCount }: PracticeAppBarProps) {
  return (
    <View style={styles.appBar}>
      <Text accessibilityRole="header" style={styles.appBarTitle}>
        Latihan
      </Text>

      <View
        accessibilityLabel={`Jumlah unit: ${unitCount} Unit`}
        style={styles.unitChip}
      >
        <Text style={styles.unitChipText}>{unitCount} Unit</Text>
      </View>
    </View>
  );
}

interface QuickPracticeCardProps {
  onPress: () => void;
}

export function QuickPracticeCard({ onPress }: QuickPracticeCardProps) {
  return (
    <View style={styles.quickCard}>
      <View style={styles.quickCardContent}>
        <Text style={styles.quickCardTitle}>Uji kemampuanmu</Text>
        <Text style={styles.quickCardDescription}>
          Latihan cepat untuk mengetahui penguasaan bahasa
        </Text>

        <AppPressable
          accessibilityLabel="Mulai latihan cepat sekarang"
          accessibilityRole="button"
          onPress={onPress}
          style={styles.quickCardCta}
        >
          <Text style={styles.quickCardCtaText}>Mulai sekarang</Text>
        </AppPressable>
      </View>

      <View style={styles.quickCardIconContainer}>
        <Icon color={colors.primary} name="flashlight-fill" size={28} />
      </View>
    </View>
  );
}

interface UnitPracticeCardProps {
  order: number;
  title: string;
  exerciseCount: number;
  isCompleted?: boolean;
  onPress?: () => void;
}

export function UnitPracticeCard({
  order,
  title,
  exerciseCount,
  isCompleted,
  onPress,
}: UnitPracticeCardProps) {
  return (
    <AppPressable
      accessibilityLabel={`Unit ${order}: ${title}, ${isCompleted ? 'selesai 100%' : `${exerciseCount} latihan`}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.unitCard}
    >
      <View style={styles.unitCardLeft}>
        <Text numberOfLines={2} style={styles.unitCardTitle}>
          Unit {order}: {title}
        </Text>
      </View>

      {isCompleted ? (
        <View accessibilityLabel="Unit selesai 100%" style={styles.completedBadge}>
          <Icon color={colors.teal} name="checkbox-circle-fill" size={24} />
        </View>
      ) : (
        <View style={styles.exerciseCountChip}>
          <Text style={styles.exerciseCountText}>{exerciseCount} latihan</Text>
        </View>
      )}
    </AppPressable>
  );
}

interface FreePracticeCardProps {
  title: string;
  description: string;
  iconName: IconName;
  accentColor: string;
  tintColor: string;
  onPress?: () => void;
}

export function FreePracticeCard({
  title,
  description,
  iconName,
  accentColor,
  tintColor,
  onPress,
}: FreePracticeCardProps) {
  return (
    <AppPressable
      accessibilityLabel={`${title}: ${description}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.freeCard}
    >
      <View style={[styles.freeCardIconBox, { backgroundColor: tintColor }]}>
        <Icon color={accentColor} name={iconName} size={22} />
      </View>

      <View style={styles.freeCardContent}>
        <Text style={styles.freeCardTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.freeCardDescription}>
          {description}
        </Text>
      </View>

      <Icon color={colors.borderStrong} name="arrow-right-s-line" size={20} />
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  appBarTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    color: colors.navy,
  },
  unitChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitChipText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Card Latihan Cepat (Horizontal)
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  quickCardContent: {
    flex: 1,
  },
  quickCardTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.navy,
  },
  quickCardDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  quickCardCta: {
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs + 3,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    minHeight: 36,
    justifyContent: 'center',
  },
  quickCardCtaText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    color: colors.surface,
  },
  quickCardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.orangeTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card Unit Latihan
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.sm,
    minHeight: touchTarget,
  },
  unitCardLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  unitCardTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.navy,
  },
  exerciseCountChip: {
    backgroundColor: colors.navyTint,
    borderRadius: 16,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseCountText: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.navy,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.tealTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card Latihan Bebas
  freeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    minHeight: touchTarget + 8,
  },
  freeCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeCardContent: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  freeCardTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.navy,
  },
  freeCardDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
