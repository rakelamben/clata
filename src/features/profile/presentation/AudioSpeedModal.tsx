import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export interface AudioSpeedModalProps {
  visible: boolean;
  onClose: () => void;
  currentSpeed: 'normal' | 'slow';
  onSelectSpeed: (speed: 'normal' | 'slow') => void;
}

export function AudioSpeedModal({
  visible,
  onClose,
  currentSpeed,
  onSelectSpeed,
}: AudioSpeedModalProps) {
  const handleChoose = (speed: 'normal' | 'slow') => {
    onSelectSpeed(speed);
    onClose();
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
          accessibilityLabel="Tutup dialog kecepatan audio"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.dialogContainer}>
          <View style={styles.dialogHeader}>
            <View style={styles.iconCircle}>
              <Icon color={colors.navy} name="volume-up-line" size={22} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.title}>Kecepatan Audio</Text>
              <Text style={styles.subtitle}>
                Pilih kecepatan pemutaran suara lafal kata dan kalimat
              </Text>
            </View>
          </View>

          {/* Opsi Kecepatan */}
          <View style={styles.optionsList}>
            {/* Opsi Normal */}
            <Pressable
              accessibilityLabel="Kecepatan Normal 1.0x"
              accessibilityRole="radio"
              accessibilityState={{ checked: currentSpeed === 'normal' }}
              onPress={() => handleChoose('normal')}
              style={({ pressed }) => [
                styles.optionItem,
                currentSpeed === 'normal' && styles.optionItemActive,
                pressed && styles.optionItemPressed,
              ]}
            >
              <View style={styles.optionTexts}>
                <Text
                  style={[
                    styles.optionTitle,
                    currentSpeed === 'normal' && styles.optionTitleActive,
                  ]}
                >
                  Normal (1.0x)
                </Text>
                <Text style={styles.optionDescription}>
                  Kecepatan alami penutur bahasa asli
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  currentSpeed === 'normal' && styles.radioOuterActive,
                ]}
              >
                {currentSpeed === 'normal' && <View style={styles.radioInner} />}
              </View>
            </Pressable>

            {/* Opsi Lambat */}
            <Pressable
              accessibilityLabel="Kecepatan Lambat 0.8x"
              accessibilityRole="radio"
              accessibilityState={{ checked: currentSpeed === 'slow' }}
              onPress={() => handleChoose('slow')}
              style={({ pressed }) => [
                styles.optionItem,
                currentSpeed === 'slow' && styles.optionItemActive,
                pressed && styles.optionItemPressed,
              ]}
            >
              <View style={styles.optionTexts}>
                <Text
                  style={[
                    styles.optionTitle,
                    currentSpeed === 'slow' && styles.optionTitleActive,
                  ]}
                >
                  Lambat (0.8x)
                </Text>
                <Text style={styles.optionDescription}>
                  Membantu menyimak artikulasi dialek lebih jelas
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  currentSpeed === 'slow' && styles.radioOuterActive,
                ]}
              >
                {currentSpeed === 'slow' && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          </View>

          {/* Tombol Tutup */}
          <Pressable
            accessibilityLabel="Tutup"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Text style={styles.closeButtonText}>Selesai</Text>
          </Pressable>
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
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    color: colors.navy,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionItem: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionItemActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealTint,
  },
  optionItemPressed: {
    backgroundColor: '#F8F9FA',
  },
  optionTexts: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.sm,
  },
  optionTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.navy,
  },
  optionTitleActive: {
    color: colors.teal,
  },
  optionDescription: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.teal,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.teal,
  },
  closeButton: {
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  closeButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.surface,
  },
});
