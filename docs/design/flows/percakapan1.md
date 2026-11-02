import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, radii, spacing } from '../../../ui/theme';
import type { DialogueChoice, DialogueRepairResponse } from '../domain/dialogueTypes';

export function ChoiceActionGroup({
  choices,
  disabled,
  selectedChoiceIndex,
  onSelectChoice,
  activeRepair,
  onRetryAfterRepair,
}: {
  choices: readonly DialogueChoice[];
  disabled: boolean;
  selectedChoiceIndex: number | null;
  onSelectChoice: (index: number) => void;
  activeRepair?: DialogueRepairResponse | null;
  onRetryAfterRepair?: () => void;
}) {
  if (activeRepair) {
    return (
      <View style={styles.repairCard} accessibilityRole="alert">
        <View style={styles.repairHeader}>
          <Icon name="information-line" size={20} color={colors.primary} />
          <Text style={styles.repairTitle}>Lawan bicara belum paham</Text>
        </View>
        <Text style={styles.repairText}>{activeRepair.text}</Text>
        <Text style={styles.repairTranslation}>{activeRepair.translation}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Coba pilih respons lain"
          onPress={onRetryAfterRepair}
          style={styles.retryButton}
        >
          <Text style={styles.retryLabel}>Pilih respons yang nyambung</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Pilih responsmu:</Text>
      <View style={styles.choiceList}>
        {choices.map((choice, index) => {
          const isSelected = selectedChoiceIndex === index;
          return (
            <Pressable
              key={`choice_${index}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={`Pilihan ${index + 1}: ${choice.text}`}
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
                  <Icon name="check-line" size={18} color={colors.surface} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
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
    backgroundColor: colors.surface,
  },
  disabledChoiceCard: {
    opacity: 0.5,
  },
  choiceContent: {
    flex: 1,
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  selectedChoiceText: {
    color: colors.primary,
  },
  choiceTranslation: {
    marginTop: 2,
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
    backgroundColor: colors.surface,
    marginVertical: spacing.xs,
  },
  repairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  repairTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  repairText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  repairTranslation: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  retryButton: {
    marginTop: spacing.md,
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  retryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});