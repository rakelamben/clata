import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon, { type IconName } from 'react-native-remix-icon';

import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export interface ProfileMenuCardProps {
  icon: IconName;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
  isDanger?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

export function ProfileMenuCard({
  icon,
  iconColor,
  iconBgColor,
  title,
  description,
  rightElement,
  isDanger = false,
  onPress,
  accessibilityLabel,
}: ProfileMenuCardProps) {
  const resolvedIconColor = isDanger
    ? colors.magenta
    : iconColor ?? colors.navy;
  const resolvedIconBg = isDanger
    ? colors.magentaTint
    : iconBgColor ?? colors.navyTint;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isDanger && styles.cardDanger,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconWrapper, { backgroundColor: resolvedIconBg }]}>
          <Icon color={resolvedIconColor} name={icon} size={20} />
        </View>

        <View style={styles.textContainer}>
          <Text
            numberOfLines={1}
            style={[styles.title, isDanger && styles.titleDanger]}
          >
            {title}
          </Text>
          {Boolean(description) && (
            <Text
              numberOfLines={1}
              style={[styles.description, isDanger && styles.descriptionDanger]}
            >
              {description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {rightElement ? (
          rightElement
        ) : (
          <Icon
            color={isDanger ? colors.magenta : colors.borderStrong}
            name="arrow-right-s-line"
            size={20}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: touchTarget + 8,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardDanger: {
    borderColor: '#F3C5D5',
    backgroundColor: '#FFF9FB',
  },
  cardPressed: {
    backgroundColor: '#F8F9FA',
    transform: [{ scale: 0.99 }],
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.navy,
  },
  titleDanger: {
    color: colors.magenta,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  descriptionDanger: {
    color: colors.magenta,
    opacity: 0.85,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
