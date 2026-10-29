import RemixIcon from 'react-native-remix-icon';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, spacing, touchTarget } from '../../../ui/theme';

type Props = {
  showBack: boolean;
  showSkip: boolean;
  reduceMotion: boolean;
  onBack: () => void;
  onSkip: () => void;
};

export function OnboardingHeader({ showBack, showSkip, reduceMotion, onBack, onSkip }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.xl) }]}>
      <View style={styles.brand}>
        {showBack ? (
          <AppPressable
            accessibilityRole="button"
            accessibilityLabel="Kembali ke langkah sebelumnya"
            onPress={onBack}
            ringRadius={touchTarget / 2}
            containerStyle={styles.iconContainer}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconPressed,
              pressed && !reduceMotion && styles.pressedScale,
            ]}
          >
            <RemixIcon name="arrow-left-line" size={24} color={colors.navy} accessible={false} />
          </AppPressable>
        ) : null}
        <Text
          accessibilityRole="text"
          accessibilityLabel="Clata"
          allowFontScaling={false}
          style={styles.wordmark}
        >
          clata<Text style={styles.wordmarkDot}>.</Text>
        </Text>
      </View>

      {showSkip ? (
        <AppPressable
          accessibilityRole="button"
          accessibilityLabel="Lewati pengantar"
          onPress={onSkip}
          ringRadius={8}
          style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
        >
          <Text maxFontSizeMultiplier={2} style={styles.skipLabel}>
            Lewati
          </Text>
          <RemixIcon name="arrow-right-line" size={18} color={colors.textSecondary} accessible={false} />
        </AppPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingBottom: spacing.md,
  },
  brand: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    alignSelf: 'center',
  },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget / 2,
  },
  iconPressed: {
    backgroundColor: colors.navyTint,
  },
  pressedScale: {
    transform: [{ scale: 0.96 }],
  },
  wordmark: {
    flexShrink: 1,
    color: colors.navy,
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: -1.5,
  },
  wordmarkDot: {
    color: colors.primary,
  },
  skip: {
    minHeight: touchTarget,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  skipPressed: {
    backgroundColor: colors.navyTint,
  },
  skipLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    lineHeight: 20,
  },
});
