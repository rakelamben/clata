import { Pressable, StyleSheet, Text, View } from 'react-native';
import RemixIcon from 'react-native-remix-icon';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

type AnswerOptionProps = {
  letter: string;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function AnswerOption({
  letter,
  label,
  selected,
  disabled,
  onPress,
}: AnswerOptionProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`Pilihan ${letter}: ${label}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selectedOption,
        pressed && !disabled && styles.pressedOption,
      ]}
    >
      <View style={[styles.letterBadge, selected && styles.letterBadgeSelected]}>
        <Text style={[styles.letterText, selected && styles.letterTextSelected]}>
          {letter}
        </Text>
      </View>

      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>

      {selected ? (
        <View style={styles.checkIconWrap}>
          <RemixIcon name="check-line" size={20} color={colors.teal} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: Math.max(touchTarget, 56),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  selectedOption: {
    borderColor: colors.teal,
    backgroundColor: colors.tealTint,
  },
  pressedOption: {
    backgroundColor: colors.navyTint,
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterBadgeSelected: {
    backgroundColor: colors.teal,
  },
  letterText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  letterTextSelected: {
    color: colors.surface,
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.navy,
  },
  checkIconWrap: {
    width: 24,
    alignItems: 'center',
  },
});
