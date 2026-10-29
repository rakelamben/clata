import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, radii, spacing } from '../../../ui/theme';
import type { DialogueEnding } from '../domain/dialogueTypes';

export function DialogueSummarySheet({
  ending,
  score,
  onRestart,
  onExit,
}: {
  ending: DialogueEnding;
  score: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const percentage = Math.round(score * 100);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerIcon}>
          <Icon name="checkbox-circle-fill" size={56} color={colors.primary} />
        </View>

        <Text style={styles.title}>Percakapan Selesai!</Text>
        <Text style={styles.scoreText}>Kesesuaian Respons: {percentage}%</Text>

        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>Catatan Evaluasi:</Text>
          <Text style={styles.feedbackBody}>{ending.feedback}</Text>

          {ending.learningPoints && ending.learningPoints.length > 0 ? (
            <View style={styles.pointsList}>
              {ending.learningPoints.map((point, index) => (
                <Text key={index} style={styles.pointItem}>• {point}</Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.actionColumn}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali ke menu latihan"
            onPress={onExit}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Selesai & Kembali</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ulangi skenario dialog ini"
            onPress={onRestart}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Coba Percakapan Lagi</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  feedbackBox: {
    width: '100%',
    backgroundColor: colors.background ?? '#FAFAFA',
    borderRadius: radii.control,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  feedbackBody: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  pointsList: {
    marginTop: spacing.sm,
    gap: 4,
  },
  pointItem: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionColumn: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
