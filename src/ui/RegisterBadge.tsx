import { StyleSheet, Text, View } from 'react-native';

import {
  REGISTER_DESCRIPTIONS,
  REGISTER_LABELS,
  type Register,
} from '../domain/Register';
import { colors, fonts, radii, spacing } from './theme';

interface RegisterBadgeProps {
  register: Register;
  showExplanation?: boolean;
}

export function RegisterBadge({ register, showExplanation = true }: RegisterBadgeProps) {
  const label = REGISTER_LABELS[register] ?? register;
  const isNetral = register === 'netral';

  return (
    <View style={styles.container}>
      <View style={[styles.badge, badgeStyles[register]]}>
        <Text style={[styles.badgeText, badgeTextStyles[register]]}>{label}</Text>
      </View>

      {isNetral && showExplanation ? (
        <Text style={styles.explanationText}>
          {REGISTER_DESCRIPTIONS.netral}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.control,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
  },
  explanationText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

const badgeStyles = StyleSheet.create({
  sopan: {
    backgroundColor: colors.navyTint,
    borderColor: colors.navy,
  },
  akrab: {
    backgroundColor: colors.magentaTint,
    borderColor: colors.magenta,
  },
  netral: {
    backgroundColor: colors.tealTint,
    borderColor: colors.teal,
  },
});

const badgeTextStyles = StyleSheet.create({
  sopan: {
    color: colors.navy,
  },
  akrab: {
    color: colors.magenta,
  },
  netral: {
    color: colors.teal,
  },
});
