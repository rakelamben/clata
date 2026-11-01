import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RemixIcon from 'react-native-remix-icon';

import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import { useReduceMotion } from '../../../ui/useReduceMotion';

type PracticeFeedbackSheetProps = {
  visible: boolean;
  correct: boolean;
  correctAnswer?: string;
  explanation?: string;
  example?: string;
  isLastQuestion: boolean;
  onNext: () => void;
};

export function PracticeFeedbackSheet({
  visible,
  correct,
  correctAnswer,
  explanation,
  example,
  isLastQuestion,
  onNext,
}: PracticeFeedbackSheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(450));

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
      } else {
        fadeAnim.setValue(0);
        slideAnim.setValue(450);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            damping: 26,
            mass: 0.9,
            stiffness: 240,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [visible, reduceMotion, fadeAnim, slideAnim]);

  const handleNext = () => {
    if (reduceMotion) {
      onNext();
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 450,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onNext();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={handleNext}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop with Fade Animation (No sliding backdrop) */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim },
          ]}
        />

        {/* Bottom Sheet with Slide-Up Animation */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(spacing.xxl, insets.bottom + spacing.md),
            },
          ]}
          role="dialog"
          aria-modal={true}
        >
          {/* Circular status icon */}
          <View
            style={[
              styles.statusIconWrap,
              correct ? styles.statusIconWrapCorrect : styles.statusIconWrapIncorrect,
            ]}
          >
            <RemixIcon
              name={correct ? 'checkbox-circle-line' : 'close-circle-line'}
              size={36}
              color={correct ? colors.teal : colors.magenta}
            />
          </View>

          {/* Heading */}
          <Text style={styles.title}>
            {correct ? 'Jawaban benar' : 'Jawaban kurang tepat'}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {!correct && correctAnswer ? (
              <>
                Jawaban yang benar adalah{' '}
                <Text style={styles.correctWord}>{correctAnswer}</Text>.{' '}
              </>
            ) : null}
            {explanation ?? (correct ? 'Pilihanmu sudah tepat.' : '')}
          </Text>

          {/* Example sentence if provided */}
          {example ? (
            <View style={styles.exampleBox}>
              <Text style={styles.exampleLabel}>Contoh Penggunaan:</Text>
              <Text style={styles.exampleText}>{example}</Text>
            </View>
          ) : null}

          {/* Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLastQuestion ? 'Selesai latihan' : 'Lanjut ke soal berikutnya'}
            onPress={handleNext}
            style={styles.fullButton}
          >
            <Text style={styles.fullButtonText}>
              {isLastQuestion ? 'Selesai' : 'Lanjut'}
            </Text>
            <RemixIcon name="arrow-right-line" size={20} color={colors.surface} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 46, 68, 0.48)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    shadowColor: '#0A2E44',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 16,
  },
  statusIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statusIconWrapCorrect: {
    backgroundColor: colors.tealTint,
  },
  statusIconWrapIncorrect: {
    backgroundColor: colors.magentaTint,
  },
  title: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 22,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: spacing.lg,
  },
  correctWord: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  exampleBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.background,
    borderRadius: radii.control,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    gap: 4,
  },
  exampleLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  exampleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  fullButton: {
    width: '100%',
    maxWidth: 340,
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
