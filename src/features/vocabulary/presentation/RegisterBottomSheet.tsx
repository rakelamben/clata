import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  REGISTER_DESCRIPTIONS,
  REGISTER_LABELS,
  type Register,
} from '../../../domain/Register';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

interface RegisterBottomSheetProps {
  register: Register | null;
  onClose: () => void;
}

const EXTENDED_REGISTER_NOTES: Record<Register, string> = {
  sopan:
    'Ragam tutur halus (krama/krama inggil) yang mengekspresikan rasa hormat dan tata krama. Digunakan saat berbicara dengan orang tua, sesepuh, guru, atau dalam situasi resmi.',
  akrab:
    'Ragam tutur santai (ngoko) yang mengekspresikan kehangatan dan persahabatan. Digunakan saat berbicara dengan teman sebaya, kerabat dekat, atau orang yang lebih muda.',
  netral:
    'Kosakata netral yang dapat digunakan secara luwes kepada siapa saja tanpa membedakan tingkatan tutur.',
};

export function RegisterBottomSheet({ register, onClose }: RegisterBottomSheetProps) {
  if (!register) return null;

  const title = REGISTER_LABELS[register] ?? register;
  const description = EXTENDED_REGISTER_NOTES[register] ?? REGISTER_DESCRIPTIONS[register];

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={Boolean(register)}
    >
      <Pressable onPress={onClose} style={styles.scrim}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetCard}>
          <View style={styles.handle} />

          <Text style={styles.eyebrow}>Tingkat Tutur Bahasa</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <AppPressable
            accessibilityLabel="Tutup penjelasan tingkat tutur"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Mengerti</Text>
          </AppPressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.navy,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    marginVertical: spacing.xs,
  },
  actionButton: {
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    marginTop: spacing.sm,
  },
  actionButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.surface,
  },
});
