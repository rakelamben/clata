import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { AppPressable } from '../../../ui/AppPressable';
import type { DialogueEndingItem } from '../../../domain/package/packageTypes';
import { colors, fonts, radii, spacing } from '../../../ui/theme';

export interface DialogueSummarySheetProps {
  ending: DialogueEndingItem;
  score: number;
  onRestart: () => void;
  onExit: () => void;
}

export function DialogueSummarySheet({
  ending,
  score,
  onRestart,
  onExit,
}: DialogueSummarySheetProps) {
  const percentage = Math.round(score * 100);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerIcon}>
          <Icon color={colors.teal} name="checkbox-circle-fill" size={64} />
        </View>

        <Text style={styles.title}>Percakapan Selesai!</Text>
        <Text style={styles.scoreText}>Kesesuaian Respons: {percentage}%</Text>

        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>Catatan Evaluasi:</Text>
          <Text style={styles.feedbackBody}>{ending.feedback}</Text>
        </View>

        <View style={styles.actionColumn}>
          <AppPressable
            accessibilityLabel="Selesai dan kembali ke unit"
            accessibilityRole="button"
            onPress={onExit}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Selesai & Kembali ke Unit</Text>
          </AppPressable>

          <AppPressable
            accessibilityLabel="Ulangi skenario percakapan ini"
            accessibilityRole="button"
            onPress={onRestart}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Coba Percakapan Lagi</Text>
          </AppPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 420,
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
    fontFamily: fonts.uiBold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  scoreText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  feedbackBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radii.control,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  feedbackTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  feedbackBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
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
    fontFamily: fonts.uiBold,
    fontSize: 16,
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
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
