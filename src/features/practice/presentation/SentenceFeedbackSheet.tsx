import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export interface SentenceFeedbackSheetProps {
  visible: boolean;
  isCorrect: boolean;
  explanation: string;
  onContinue: () => void;
}

export function SentenceFeedbackSheet({
  visible,
  isCorrect,
  explanation,
  onContinue,
}: SentenceFeedbackSheetProps) {
  const [slideAnim] = useState(() => new Animated.Value(300));

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  const iconName = isCorrect ? 'checkbox-circle-fill' : 'close-circle-fill';
  const iconColor = isCorrect ? colors.teal : colors.magenta;
  const iconBgColor = isCorrect ? colors.tealTint : colors.magentaTint;
  const titleText = isCorrect ? 'Jawaban benar' : 'Jawaban salah';

  return (
    <Modal
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <SafeAreaView edges={['bottom']} style={styles.sheetContainer}>
            {/* 1. Icon Benar / Salah */}
            <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
              <Icon color={iconColor} name={iconName} size={36} />
            </View>

            {/* 2. Judul "Jawaban benar" / "Jawaban salah" */}
            <Text style={styles.titleText}>{titleText}</Text>

            {/* 3. Label Penjelasan (Kalimat utuh & arti terjemahan) */}
            <Text style={styles.explanationText}>{explanation}</Text>

            {/* 4. Tombol Lanjut */}
            <View style={styles.buttonContainer}>
              <AppPressable
                accessibilityLabel="Lanjut ke kalimat berikutnya"
                accessibilityRole="button"
                onPress={onContinue}
                style={styles.continueButton}
              >
                <Text style={styles.continueButtonText}>Lanjut</Text>
              </AppPressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  animatedContainer: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  titleText: {
    fontFamily: fonts.uiBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.navy,
    textAlign: 'center',
  },
  explanationText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.md,
  },
  continueButton: {
    width: '100%',
    height: touchTarget + 4,
    backgroundColor: colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
