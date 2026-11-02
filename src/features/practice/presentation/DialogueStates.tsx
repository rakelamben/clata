import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing } from '../../../ui/theme';

export function DialogueLoading() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator accessibilityLabel="Memuat percakapan" color={colors.primary} size="large" />
      <Text style={styles.loadingText}>Menyiapkan percakapan...</Text>
    </View>
  );
}

export function DialogueError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.centerContainer}>
      <Text accessibilityRole="alert" style={styles.errorText}>
        {message}
      </Text>
      {onRetry ? (
        <AppPressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Coba lagi</Text>
        </AppPressable>
      ) : null}
    </View>
  );
}

export function DialogueEmpty({ message }: { message: string }) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    fontSize: 15,
  },
  errorText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.magenta,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 48,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing.lg,
  },
  retryLabel: {
    color: colors.surface,
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
});
