import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../../ui/theme';

export function DialogueLoading() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator accessibilityLabel="Memuat percakapan" color={colors.primary} size="large" />
      <Text style={styles.loadingText}>Menyiapkan dialog...</Text>
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
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Coba lagi</Text>
        </Pressable>
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
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 15,
  },
  errorText: {
    color: colors.magenta,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
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
    fontWeight: '700',
    fontSize: 16,
  },
});
