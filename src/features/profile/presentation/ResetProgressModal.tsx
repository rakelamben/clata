import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export interface ResetProgressModalProps {
  visible: boolean;
  onClose: () => void;
  packageName: string;
  onConfirmReset: () => Promise<void>;
}

export function ResetProgressModal({
  visible,
  onClose,
  packageName,
  onConfirmReset,
}: ResetProgressModalProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsResetting(true);
      await onConfirmReset();
      onClose();
    } catch (err) {
      console.warn('Gagal mereset progres:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel="Tutup dialog konfirmasi reset"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.dialogContainer}>
          <View style={styles.iconCircle}>
            <Icon color={colors.magenta} name="error-warning-fill" size={28} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Reset Progres Belajar?</Text>
            <Text style={styles.message}>
              Seluruh riwayat latihan, streak harian, tantangan, dan kata yang
              dipelajari untuk paket{' '}
              <Text style={styles.packageHighlight}>{`"${packageName}"`}</Text> akan
              dihapus dan diatur ulang ke awal.
            </Text>
            <Text style={styles.warningSubtext}>
              Tindakan ini tidak dapat dibatalkan. Berkas paket bahasa tetap aman
              di perangkat Anda.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              accessibilityLabel="Batal reset"
              accessibilityRole="button"
              disabled={isResetting}
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Konfirmasi reset progres"
              accessibilityRole="button"
              disabled={isResetting}
              onPress={() => void handleConfirm()}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {isResetting ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Reset Progres</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 46, 68, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.magentaTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    color: colors.navy,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
  packageHighlight: {
    fontFamily: fonts.uiBold,
    color: colors.navy,
  },
  warningSubtext: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: 24,
    backgroundColor: colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.surface,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
