import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, radii, spacing } from '../../../ui/theme';

export function SelfSpeakStep({
  visible,
  targetText,
  translation,
  onComplete,
  onSkip,
}: {
  visible: boolean;
  targetText: string;
  translation?: string;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal
      onRequestClose={onSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.iconContainer}>
            <Icon name="chat-voice-line" size={32} color={colors.primary} />
          </View>

          <Text style={styles.badgeLabel}>Ucapkan Sendiri (Opsional)</Text>
          <Text style={styles.instructionText}>
            Latih kelancaranmu dengan mengucapkan kalimat ini dengan suara terdengar:
          </Text>

          <View style={styles.phraseBox}>
            <Text style={styles.targetText}>{targetText}</Text>
            {translation ? <Text style={styles.translationText}>{translation}</Text> : null}
          </View>

          <Text style={styles.disclaimerText}>
            Aplikasi ini tidak merekam suaramu dan tidak meminta izin mikrofon.
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lewati langkah ucapkan sendiri"
              onPress={onSkip}
              style={styles.skipButton}
            >
              <Text style={styles.skipLabel}>Lewati</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Selesai mengucapkan dengan suara"
              onPress={onComplete}
              style={styles.completeButton}
            >
              <Text style={styles.completeLabel}>Sudah Kuucapkan</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.navyTint ?? '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.sm,
    lineHeight: 22,
  },
  phraseBox: {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.background ?? '#F9F9F9',
    borderRadius: radii.control,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  targetText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  translationText: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  skipButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  completeButton: {
    flex: 2,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.control,
    backgroundColor: colors.primary,
  },
  completeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});
