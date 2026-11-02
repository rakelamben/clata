import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, fonts, radii, spacing } from '../../../ui/theme';

export interface ProfileUnitItemProgress {
  unitId: string;
  order: number;
  title: string;
  completedSessions: number;
  totalSessions: number;
  percentage: number; // 0 to 100
  isCompleted: boolean;
}

export interface ProfileUnitAccordionProps {
  units: ProfileUnitItemProgress[];
  onPressUnit: (unit: ProfileUnitItemProgress) => void;
}

export function ProfileUnitAccordion({
  units,
  onPressUnit,
}: ProfileUnitAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedUnitsCount = units.filter((u) => u.isCompleted).length;
  const totalUnits = units.length;

  return (
    <View style={styles.container}>
      {/* Header Akordion */}
      <Pressable
        accessibilityLabel={`Penyelesaian Unit: ${completedUnitsCount} dari ${totalUnits} unit selesai. Ketuk untuk ${isExpanded ? 'menutup' : 'membuka'} rincian.`}
        accessibilityRole="button"
        onPress={() => setIsExpanded((prev) => !prev)}
        style={({ pressed }) => [
          styles.headerCard,
          isExpanded && styles.headerCardExpanded,
          pressed && styles.headerPressed,
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <Icon color={colors.teal} name="book-open-line" size={20} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Penyelesaian Unit</Text>
            <Text style={styles.headerDescription}>
              {completedUnitsCount} dari {totalUnits} unit tuntas
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Icon
            color={colors.textSecondary}
            name={isExpanded ? 'arrow-up-s-line' : 'arrow-down-s-line'}
            size={20}
          />
        </View>
      </Pressable>

      {/* Konten Saat Terbuka */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {units.map((unit) => (
            <Pressable
              key={unit.unitId}
              accessibilityLabel={`Unit ${unit.order}: ${unit.title}. Progres ${unit.percentage}%. Ketuk untuk detail.`}
              accessibilityRole="button"
              onPress={() => onPressUnit(unit)}
              style={({ pressed }) => [
                styles.unitRowCard,
                unit.isCompleted && styles.unitRowCardCompleted,
                pressed && styles.unitRowPressed,
              ]}
            >
              <View style={styles.unitRowTop}>
                <View style={styles.unitTitleWrapper}>
                  <Text style={styles.unitOrderText}>Unit {unit.order}</Text>
                  <Text numberOfLines={1} style={styles.unitTitleText}>
                    {unit.title}
                  </Text>
                </View>

                {unit.isCompleted ? (
                  <View style={styles.completedBadge}>
                    <Icon color={colors.teal} name="checkbox-circle-fill" size={18} />
                    <Text style={styles.completedText}>100%</Text>
                  </View>
                ) : (
                  <Text style={styles.progressText}>
                    {unit.completedSessions}/{unit.totalSessions} sesi
                  </Text>
                )}
              </View>

              {/* Progress Bar Unit */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${unit.percentage}%`,
                      backgroundColor: unit.isCompleted ? colors.teal : colors.primary,
                    },
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCardExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerPressed: {
    backgroundColor: '#F8F9FA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: radii.control,
    backgroundColor: colors.tealTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.navy,
  },
  headerDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  headerRight: {
    paddingLeft: spacing.sm,
  },
  expandedContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: '#FAFAFA',
  },
  unitRowCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  unitRowCardCompleted: {
    borderColor: '#BBE3DB',
    backgroundColor: '#F7FBFA',
  },
  unitRowPressed: {
    backgroundColor: '#F1F5F7',
  },
  unitRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitTitleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  unitOrderText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.primary,
  },
  unitTitleText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  completedText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.teal,
  },
  progressText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.navyTint,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
