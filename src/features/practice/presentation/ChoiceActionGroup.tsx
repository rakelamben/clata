import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { AppPressable } from '../../../ui/AppPressable';
import type { DialogueChoiceItem, DialogueRepairItem } from '../../../domain/package/packageTypes';
import { colors, fonts, radii, spacing } from '../../../ui/theme';

export interface ChoiceActionGroupProps {
  choices: readonly DialogueChoiceItem[];
  disabled: boolean;
  selectedChoiceIndex: number | null;
  onSelectChoice: (index: number) => void;
  activeRepair?: DialogueRepairItem | null;
  onRetryAfterRepair?: () => void;
}

export function ChoiceActionGroup({
  choices,
  disabled,
  selectedChoiceIndex,
  onSelectChoice,
  activeRepair,
  onRetryAfterRepair,
}: ChoiceActionGroupProps) {
  if (activeRepair) {
    return (
      <View accessibilityRole="alert" style={styles.repairCard}>
        <View style={styles.repairHeader}>
          <Icon color={colors.primary} name="information-line" size={20} />
          <Text style={styles.repairTitle}>Lawan bicara belum paham</Text>
        </View>
        <Text style={styles.repairText}>{activeRepair.text}</Text>
        {activeRepair.translation ? (
          <Text style={styles.repairTranslation}>{activeRepair.translation}</Text>
        ) : null}

        <AppPressable
          accessibilityLabel="Pilih respons yang nyambung"
          accessibilityRole="button"
          onPress={onRetryAfterRepair}
          style={styles.retryButton}
        >
          <Text style={styles.retryLabel}>Pilih respons yang nyambung</Text>
        </AppPressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PILIH RESPONSMU:</Text>
      <View style={styles.choiceList}>
        {choices.map((choice, index) => {
          const isSelected = selectedChoiceIndex === index;
          return (
            <AppPressable
              key={`choice_${index}`}
              accessibilityLabel={`Pilihan ${index + 1}: ${choice.text}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled}
              onPress={() => onSelectChoice(index)}
              style={[
                styles.choiceCard,
                isSelected && styles.selectedChoiceCard,
                disabled && !isSelected && styles.disabledChoiceCard,
              ]}
            >
              <View style={styles.choiceContent}>
                <Text style={[styles.choiceText, isSelected && styles.selectedChoiceText]}>
                  {choice.text}
                </Text>
                {choice.translation ? (
                  <Text style={styles.choiceTranslation}>{choice.translation}</Text>
                ) : null}
              </View>

              {isSelected ? (
                <View style={styles.selectedIcon}>
                  <Icon color={colors.surface} name="check-line" size={18} />
                </View>
              ) : null}
            </AppPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  choiceList: {
    gap: spacing.sm,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedChoiceCard: {
    borderColor: colors.primary,
    backgroundColor: colors.orangeTint,
  },
  disabledChoiceCard: {
    opacity: 0.5,
  },
  choiceContent: {
    flex: 1,
  },
  choiceText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  selectedChoiceText: {
    color: colors.primary,
  },
  choiceTranslation: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  selectedIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  repairCard: {
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.orangeTint,
    marginVertical: spacing.xs,
  },
  repairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  repairTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.primary,
  },
  repairText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  repairTranslation: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  retryButton: {
    marginTop: spacing.md,
    minHeight: 46,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  retryLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.surface,
  },
});
