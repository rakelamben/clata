import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export function ChallengeLoading() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator accessibilityLabel="Memuat tantangan" color={colors.primary} size="large" />
      <Text style={styles.loadingText}>Menyiapkan kartu tantangan...</Text>
    </View>
  );
}

export function ChallengeError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.centerContainer}>
      <Text accessibilityRole="alert" style={styles.errorText}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Coba lagi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ChallengeEmpty({ message }: { message: string }) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyTitle}>Belum Ada Tantangan</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loadingText: {
    fontFamily: fonts.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 15,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    color: colors.magenta,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  emptyText: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    minHeight: touchTarget,
    minWidth: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing.lg,
  },
  retryLabel: {
    fontFamily: fonts.uiSemiBold,
    color: colors.surface,
    fontSize: 15,
  },
});
