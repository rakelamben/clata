import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

type PracticeConfirmModalProps = {
  visible: boolean;
  type: 'exit' | 'replace' | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PracticeConfirmModal({
  visible,
  type,
  onConfirm,
  onCancel,
}: PracticeConfirmModalProps) {
  if (!visible || !type) return null;

  const isReplace = type === 'replace';
  const title = isReplace ? 'Mulai sesi baru?' : 'Keluar dari sesi?';
  const message = isReplace
    ? 'Sesi yang belum selesai akan diganti. Jawaban sesi lama akan dihapus setelah kamu mengonfirmasi.'
    : 'Jawaban yang sudah tersimpan tetap aman.';
  const confirmText = isReplace ? 'Ya, mulai baru' : 'Keluar dari sesi';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard} role="dialog" aria-modal={true}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={confirmText}
            onPress={onConfirm}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{confirmText}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Batal"
            onPress={onCancel}
            style={styles.textButton}
          >
            <Text style={styles.textButtonText}>Batal</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 24,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    width: '100%',
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.surface,
  },
  textButton: {
    width: '100%',
    minHeight: touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  textButtonText: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: colors.navy,
    textDecorationLine: 'underline',
  },
});
