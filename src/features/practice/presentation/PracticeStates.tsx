import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import RemixIcon from 'react-native-remix-icon';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export function PracticeLoading({ message = 'Menyiapkan latihan…' }: { message?: string }) {
  return (
    <View style={styles.loadingContainer} role="status">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function PracticeError({
  message,
  description = 'Periksa penyimpanan perangkat, lalu coba lagi.',
  onRetry,
}: {
  message: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.emptyContainer} role="alert">
      <View style={styles.emptyIconWrap}>
        <RemixIcon name="error-warning-line" size={40} color={colors.magenta} />
      </View>
      <Text style={styles.emptyTitle}>{message}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Coba lagi"
          onPress={onRetry}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>Coba lagi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PracticeEmpty({
  title = 'Paket belajar belum tersedia.',
  description = 'Pasang paket materi belajar untuk mulai berlatih.',
  onAction,
  actionLabel = 'Pasang paket',
}: {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <RemixIcon name="book-open-line" size={40} color={colors.navy} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    minHeight: 240,
  },
  loadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    minHeight: 280,
  },
  emptyIconWrap: {
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: spacing.md,
    minHeight: touchTarget,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.surface,
  },
});
