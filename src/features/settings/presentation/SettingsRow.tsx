import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, fonts, radii, spacing } from '../../../ui/theme';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  leadingIcon?: ComponentProps<typeof Icon>['name'];
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  rightElement?: ReactNode;
}

export function SettingsRow({
  title,
  subtitle,
  value,
  onPress,
  destructive = false,
  disabled = false,
  leadingIcon,
  accessibilityLabel,
  accessibilityHint,
  testID,
  rightElement,
}: SettingsRowProps) {
  const label =
    accessibilityLabel ?? `${title}${subtitle ? `, ${subtitle}` : ''}${value ? `, ${value}` : ''}`;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        destructive && styles.destructiveRow,
        disabled && styles.disabledRow,
        pressed && styles.pressed,
      ]}
    >
      {leadingIcon ? (
        <View style={styles.iconContainer} importantForAccessibility="no">
          <Icon
            name={leadingIcon}
            size={22}
            color={destructive ? colors.magenta : colors.navy}
          />
        </View>
      ) : null}

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            destructive && styles.destructiveText,
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement ? (
        rightElement
      ) : value ? (
        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{value}</Text>
          <Icon name="arrow-right-s-line" size={20} color={colors.textSecondary} />
        </View>
      ) : (
        <Icon name="arrow-right-s-line" size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  destructiveRow: {
    borderColor: '#fed7d7',
    backgroundColor: '#fff5f5',
  },
  disabledRow: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.75,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  destructiveText: {
    color: colors.magenta,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  valueText: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
