import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import type { ChallengeCardItem, ChallengeVariantType } from '../domain/challengeTypes';

export function ChallengeCard({
  challenge,
  onPressCard,
  onToggleCheck,
}: {
  challenge: ChallengeCardItem;
  onPressCard: () => void;
  onToggleCheck: (challengeId: string, variant: ChallengeVariantType) => void;
}) {
  const isCompleted = challenge.isChecked;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tantangan ${challenge.title}. ${isCompleted ? 'Sudah selesai.' : 'Ketuk untuk melihat detail.'}`}
      onPress={onPressCard}
      style={({ pressed }) => [
        styles.card,
        isCompleted ? styles.cardCompleted : styles.cardNormal,
        pressed && styles.cardPressed,
      ]}
    >
      {/* 1. Judul (Pill sudah selesai dihilangkan) */}
      <Text style={styles.title}>{challenge.title}</Text>

      {/* 2. Penjelasan */}
      {challenge.objective ? (
        <Text style={styles.objective}>{challenge.objective}</Text>
      ) : null}

      {/* 3 & 4. Divider Line & Checkbox (Hanya tampil jika belum selesai) */}
      {!isCompleted ? (
        <>
          <View style={styles.divider} />

          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="Tandai selesai"
            accessibilityState={{ checked: false }}
            onPress={() => onToggleCheck(challenge.id, 'solo')}
            style={({ pressed }) => [
              styles.checkboxRow,
              pressed && styles.checkboxRowPressed,
            ]}
          >
            <View style={styles.checkboxSquare}>
              {/* Kotak kosong */}
            </View>
            <Text style={styles.checkboxLabel}>Tandai selesai</Text>
          </Pressable>
        </>
      ) : null}
    </Pressable>
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
    backgroundColor: '#EDF7F5', // Hijau tema agak pudar
    borderColor: '#BBE3DB',
  },
  cardPressed: {
    opacity: 0.92,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.navy,
    letterSpacing: -0.2,
    lineHeight: 24,
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
  checkboxRowPressed: {
    opacity: 0.7,
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
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});