import { ScrollView, StyleSheet, Text } from 'react-native';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing } from '../../../ui/theme';

type Props = {
  themes: string[];
  registers: string[];
  theme?: string;
  register?: string;
  onTheme: (value?: string) => void;
  onRegister: (value?: string) => void;
};

export function VocabularyFilterSheet({
  themes,
  registers,
  theme,
  register,
  onTheme,
  onRegister,
}: Props) {
  if (themes.length === 0 && registers.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityLabel="Filter kosakata"
    >
      {themes.map((value) => {
        const isSelected = theme === value;
        return (
          <AppPressable
            key={`theme-${value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filter tema ${value}`}
            onPress={() => onTheme(isSelected ? undefined : value)}
            ringRadius={radii.control}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              Tema: {value}
            </Text>
          </AppPressable>
        );
      })}
      {registers.map((value) => {
        const isSelected = register === value;
        return (
          <AppPressable
            key={`register-${value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filter register ${value}`}
            onPress={() => onRegister(isSelected ? undefined : value)}
            ringRadius={radii.control}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {value}
            </Text>
          </AppPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.surface,
    fontFamily: fonts.uiSemiBold,
  },
});
