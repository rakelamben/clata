import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { colors, fonts, radii, spacing } from '../../../ui/theme';

interface StreakToastBannerProps {
  visible: boolean;
  onDismiss: () => void;
}

export function StreakToastBanner({ visible, onDismiss }: StreakToastBannerProps) {
  const [translateY] = useState(() => new Animated.Value(-60));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -60,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss());
      }, 2600);

      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss, translateY, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Icon color={colors.surface} name="fire-fill" size={20} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Streak Hari Ini Menyala! 🔥</Text>
          <Text style={styles.subtitle}>Target 10 kata harianmu telah terpenuhi.</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flexShrink: 1,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
