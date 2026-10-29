import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, radii, spacing } from '../../../ui/theme';

interface WarningBottomModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  loading?: boolean;
}

export function WarningBottomModal({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  isDestructive = true,
  loading = false,
}: WarningBottomModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal={true}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityLabel="Tutup dialog konfirmasi"
          accessibilityRole="button"
        />

        <View
          style={styles.sheet}
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${description}`}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                isDestructive ? styles.dangerCircle : styles.warningCircle,
              ]}
              importantForAccessibility="no"
            >
              <Icon
                name={isDestructive ? 'error-warning-line' : 'alert-line'}
                size={28}
                color={isDestructive ? colors.magenta : colors.warning}
              />
            </View>

            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          </View>

          <Text style={styles.description}>{description}</Text>

          <View style={styles.actionContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmButton,
                isDestructive ? styles.dangerButton : styles.primaryButton,
                pressed && styles.buttonPressed,
                loading && styles.disabledButton,
              ]}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Memproses…' : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerCircle: {
    backgroundColor: '#fff5f5',
  },
  warningCircle: {
    backgroundColor: '#fffaf0',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: colors.magenta,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});
