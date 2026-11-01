import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing, touchTarget } from '../../../ui/theme';
import { useReduceMotion } from '../../../ui/useReduceMotion';

type PracticeSetupSkeletonProps = {
  mode: 'guess' | 'gap' | 'dialog';
};

export function PracticeSetupSkeleton({ mode }: PracticeSetupSkeletonProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [pulseAnim] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    if (reduceMotion) {
      pulseAnim.setValue(0.6);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim, reduceMotion]);

  const isDialog = mode === 'dialog';

  return (
    <View style={styles.screen}>
      {/* Topbar Skeleton */}
      <View style={[styles.topbar, { paddingTop: insets.top, minHeight: 56 + insets.top }]}>
        <Animated.View style={[styles.iconPlaceholder, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.titlePlaceholder, { opacity: pulseAnim }]} />
        <View style={styles.topbarSpacer} />
      </View>

      {/* Body Skeleton */}
      <View
        style={[
          styles.body,
          styles.bodyCentered,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Context Pills Skeleton */}
        <View style={styles.contextRow}>
          <Animated.View style={[styles.pillPlaceholder, { width: 96, opacity: pulseAnim }]} />
          <Animated.View style={[styles.pillPlaceholder, { width: 120, opacity: pulseAnim }]} />
        </View>

        {/* Main Stage Skeleton */}
        <View style={[styles.mainStage, styles.mainStageCentered]}>
          {/* Illustration Box Skeleton */}
          <Animated.View
            style={[
              styles.illustrationPlaceholder,
              isDialog ? styles.illustrationDialog : styles.illustrationStructured,
              { opacity: pulseAnim },
            ]}
          />

          {/* Instruction Lines Skeleton */}
          <View style={styles.instructionWrap}>
            <Animated.View style={[styles.instructionLine, { width: 220, opacity: pulseAnim }]} />
            <Animated.View style={[styles.instructionLine, { width: 160, opacity: pulseAnim }]} />
          </View>

          {/* Details / Carousel Skeleton */}
          {isDialog ? (
            <Animated.View style={[styles.carouselCardPlaceholder, { opacity: pulseAnim }]} />
          ) : (
            <View style={styles.detailsRow}>
              <Animated.View style={[styles.detailChipPlaceholder, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.detailChipPlaceholder, { width: 130, opacity: pulseAnim }]} />
            </View>
          )}
        </View>
      </View>

      {/* Footer Button Skeleton */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Animated.View style={[styles.buttonPlaceholder, { opacity: pulseAnim }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topbar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: radii.control,
    backgroundColor: 'rgba(10, 46, 68, 0.1)',
  },
  titlePlaceholder: {
    width: 140,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(10, 46, 68, 0.12)',
  },
  topbarSpacer: {
    width: 36,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
  },
  bodyCentered: {
    justifyContent: 'space-between',
  },
  contextRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pillPlaceholder: {
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 46, 68, 0.08)',
  },
  mainStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  mainStageCentered: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 0,
    marginTop: -spacing.md,
  },
  illustrationPlaceholder: {
    borderRadius: radii.sheet,
    backgroundColor: 'rgba(10, 46, 68, 0.08)',
    marginBottom: spacing.lg,
  },
  illustrationDialog: {
    width: 192,
    height: 132,
  },
  illustrationStructured: {
    width: 260,
    height: 180,
  },
  instructionWrap: {
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  instructionLine: {
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(10, 46, 68, 0.1)',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  detailChipPlaceholder: {
    width: 80,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(10, 46, 68, 0.08)',
  },
  carouselCardPlaceholder: {
    width: 280,
    height: 120,
    borderRadius: radii.sheet,
    backgroundColor: 'rgba(10, 46, 68, 0.06)',
    borderWidth: 2,
    borderColor: 'rgba(10, 46, 68, 0.1)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  buttonPlaceholder: {
    width: '100%',
    minHeight: touchTarget,
    borderRadius: radii.control,
    backgroundColor: 'rgba(173, 54, 3, 0.25)',
  },
});
