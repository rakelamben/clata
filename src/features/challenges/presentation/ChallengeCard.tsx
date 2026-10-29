import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, radii, spacing } from '../../../ui/theme';
import type { ChallengeCardItem, ChallengeVariantType } from '../domain/challengeTypes';
import { VariantSelector } from './VariantSelector';
import { RescuePhraseDrawer } from './RescuePhraseDrawer';

export function ChallengeCard({
  challenge,
  onToggleCheck,
  onPlayAudio,
}: {
  challenge: ChallengeCardItem;
  onToggleCheck: (challengeId: string, variant: ChallengeVariantType) => void;
  onPlayAudio?: (audioPath: string) => void;
}) {
  const [variant, setVariant] = useState<ChallengeVariantType>(
    challenge.checkedVariant ?? 'solo',
  );

  const instructions = variant === 'social' ? challenge.social : challenge.solo;

  return (
    <View style={styles.card}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{challenge.level}</Text>
          </View>
          {challenge.estimatedDurationMinutes ? (
            <View style={styles.durationBadge}>
              <Icon name="time-line" size={12} color={colors.textSecondary} />
              <Text style={styles.durationText}>{challenge.estimatedDurationMinutes} Menit</Text>
            </View>
          ) : null}
        </View>

        {challenge.isChecked ? (
          <View style={styles.completedBadge}>
            <Icon name="check-line" size={12} color={colors.surface} />
            <Text style={styles.completedText}>Sudah Dicoba</Text>
          </View>
        ) : null}
      </View>

      {/* Title & Objective */}
      <Text style={styles.title}>{challenge.title}</Text>
      {challenge.objective ? (
        <Text style={styles.objective}>{challenge.objective}</Text>
      ) : null}

      {/* Solo vs Sosial Switcher */}
      <VariantSelector selectedVariant={variant} onSelectVariant={setVariant} />

      {/* Instructions Box */}
      <View style={styles.instructionBox}>
        <Text style={styles.instructionLabel}>Langkah Praktik:</Text>
        <Text style={styles.instructionText}>{instructions}</Text>
      </View>

      {/* Safety Guidance Box */}
      {challenge.safetyGuidance ? (
        <View style={styles.safetyBox}>
          <Icon name="shield-check-line" size={16} color={colors.primary} />
          <Text style={styles.safetyText}>{challenge.safetyGuidance}</Text>
        </View>
      ) : null}

      {/* Rescue Phrases Drawer */}
      {challenge.rescuePhrases && challenge.rescuePhrases.length > 0 ? (
        <RescuePhraseDrawer phrases={challenge.rescuePhrases} onPlayAudio={onPlayAudio} />
      ) : null}

      {/* Checkbox 'Sudah kucoba' */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="Tandai tantangan sudah dicoba"
        accessibilityState={{ checked: challenge.isChecked }}
        onPress={() => onToggleCheck(challenge.id, variant)}
        style={[styles.checkboxContainer, challenge.isChecked && styles.checkboxActiveContainer]}
      >
        <View style={[styles.checkboxSquare, challenge.isChecked && styles.checkboxChecked]}>
          {challenge.isChecked ? (
            <Icon name="check-line" size={16} color={colors.surface} />
          ) : null}
        </View>
        <View style={styles.checkboxLabelContainer}>
          <Text style={[styles.checkboxLabel, challenge.isChecked && styles.checkboxCheckedLabel]}>
            Sudah kucoba
          </Text>
          <Text style={styles.checkboxSubtext}>
            Dicatat hanya di perangkat ini. Tidak mengubah nilai apa pun.
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  levelBadge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  levelText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background ?? '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 2,
  },
  durationText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 2,
  },
  completedText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  objective: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  instructionBox: {
    backgroundColor: colors.background ?? '#FAFAFA',
    borderRadius: radii.control,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background ?? '#FAFAFA',
  },
  checkboxActiveContainer: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  checkboxCheckedLabel: {
    color: colors.primary,
  },
  checkboxSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
