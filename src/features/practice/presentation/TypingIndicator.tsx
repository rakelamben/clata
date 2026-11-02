import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../../../ui/theme';

export interface TypingIndicatorProps {
  speaker: string;
}

export function TypingIndicator({ speaker }: TypingIndicatorProps) {
  const [dot1] = useState(() => new Animated.Value(0));
  const [dot2] = useState(() => new Animated.Value(0));
  const [dot3] = useState(() => new Animated.Value(0));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Fade in container
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    // Staggered bouncing dots loop
    const createBounceAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: -6,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.delay(300),
          ]),
        ),
      ]);
    };

    const anim1 = createBounceAnimation(dot1, 0);
    const anim2 = createBounceAnimation(dot2, 150);
    const anim3 = createBounceAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3, fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.headerRow}>
        <Text style={styles.speakerName}>{speaker}</Text>
        <Text style={styles.typingLabel}>sedang mengetik...</Text>
      </View>

      <View style={styles.bubble}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    maxWidth: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
  },
  speakerName: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  typingLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 4,
    gap: 6,
    minHeight: 40,
    minWidth: 64,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
});
