import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import type {
  ChallengeCardItem,
  ChallengeVariantType,
} from '../domain/challengeTypes';

export function ChallengeCard({
  challenge,
  isFadingOut,
  onPressCard,
  onToggleCheck,
}: {
  challenge: ChallengeCardItem;
  isFadingOut?: boolean;
  onPressCard: () => void;
  onToggleCheck: (challengeId: string, variant: ChallengeVariantType) => void;
}) {
  const isCompleted = challenge.isChecked;
  const [opacityAnim] = useState(() => new Animated.Value(1));
  const [scaleAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (isFadingOut) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [isFadingOut, opacityAnim, scaleAnim]);

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <AppPressable
        accessibilityLabel={`Tantangan ${challenge.title}. ${isCompleted ? 'Sudah selesai.' : 'Ketuk untuk melihat detail.'}`}
        accessibilityRole="button"
        onPress={onPressCard}
        style={[
          styles.card,
          isCompleted ? styles.cardCompleted : styles.cardNormal,
        ]}
      >
        {/* 1. Header Kartu: Judul di kiri, Lencana Centang Selesai di kanan jika sudah selesai */}
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{challenge.title}</Text>
          {isCompleted && (
            <View accessibilityLabel="Selesai" style={styles.completedBadge}>
              <Icon color={colors.teal} name="checkbox-circle-fill" size={22} />
            </View>
          )}
        </View>

        {/* 2. Penjelasan / Objektif */}
        {challenge.objective ? (
          <Text style={styles.objective}>{challenge.objective}</Text>
        ) : null}

        {/* 3. Divider & Checkbox "Tandai selesai" (Hanya tampil jika belum selesai) */}
        {!isCompleted ? (
          <>
            <View style={styles.divider} />

            <AppPressable
              accessibilityLabel="Tandai selesai"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: false }}
              onPress={() => onToggleCheck(challenge.id, 'solo')}
              style={styles.checkboxRow}
            >
              <View style={styles.checkboxSquare} />
              <Text style={styles.checkboxLabel}>Tandai selesai</Text>
            </AppPressable>
          </>
        ) : null}
      </AppPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  cardNormal: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardCompleted: {
    backgroundColor: colors.tealTint,
    borderColor: '#BBE3DB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.uiBold,
    fontSize: 17,
    color: colors.navy,
    letterSpacing: -0.2,
    lineHeight: 23,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objective: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget - 8,
    gap: spacing.sm,
    paddingVertical: 2,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  checkboxLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
