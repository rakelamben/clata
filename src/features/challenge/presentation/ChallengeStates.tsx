import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export function ChallengeLoading() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>Memuat daftar tantangan...</Text>
    </View>
  );
}

export function ChallengeEmpty({ message }: { message: string }) {
  return (
    <View style={styles.centerContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon color={colors.textSecondary} name="flag-line" size={36} />
      </View>
      <Text style={styles.emptyTitle}>Tidak Ada Tantangan</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export function ChallengeError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.magentaTint }]}>
        <Icon color={colors.magenta} name="error-warning-line" size={36} />
      </View>
      <Text style={styles.emptyTitle}>Gagal Memuat Tantangan</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      <AppPressable
        accessibilityLabel="Coba lagi memuat tantangan"
        accessibilityRole="button"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Icon color={colors.surface} name="refresh-line" size={18} />
        <Text style={styles.retryButtonText}>Coba Lagi</Text>
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    color: colors.navy,
    textAlign: 'center',
  },
  emptyMessage: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    minHeight: touchTarget - 4,
    marginTop: spacing.xs,
  },
  retryButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.surface,
  },
});
